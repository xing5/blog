package me.xingwu.flume.plugins;

import java.io.IOException;
import java.nio.charset.Charset;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Map;

import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamConstants;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamReader;

import org.apache.flume.Context;
import org.apache.flume.Event;
import org.apache.flume.annotations.InterfaceAudience;
import org.apache.flume.annotations.InterfaceStability;
import org.apache.flume.event.EventBuilder;
import org.apache.flume.serialization.EventDeserializer;
import org.apache.flume.serialization.ResettableInputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.base.Joiner;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;

@InterfaceAudience.Private
@InterfaceStability.Evolving
public class MyXMLDeserializer implements EventDeserializer {

    private static final Logger logger = LoggerFactory.getLogger(MyXMLDeserializer.class);

    private final ResettableInputStream in;
    private XMLStreamReader r;
    private final Charset outputCharset;
    private final String nullData;
    private volatile boolean isOpen;
    private int generalColumnsIndex = -1;
    private boolean inMdScope = false, inMvScope = false;
    private String firstColName = "";
    private String moid = "";
    private List<String> dataCols;
    private List<String> generalCols;

    private final List<String> generalColNames;
    private static final String MYXML_MD_ELEMENT = "md";
    private static final String MYXML_MV_ELEMENT = "mv";
    private static final String MYXML_MT_ELEMENT = "mt";
    private static final String MYXML_MOID_ELEMENT = "moid";
    private static final String MYXML_R_ELEMENT = "r";

    public static final String OUT_CHARSET_KEY = "outputCharset";
    public static final String CHARSET_DFLT = "UTF-8";

    public static final String GENERAL_COLUMNS = "generalColumns";
    public static final String GENERAL_COLUMNS_DFLT = "neun,nedn,nesw,mts,gp";

    public static final String NULL_DATA = "nullData";
    public static final String NULL_DATA_DFLT = "\\N";

    MyXMLDeserializer(Context context, ResettableInputStream in) {
        this.in = in;
        this.isOpen = true;
        this.outputCharset = Charset.forName(context.getString(OUT_CHARSET_KEY, CHARSET_DFLT));
        this.nullData = context.getString(NULL_DATA, NULL_DATA_DFLT);
        this.generalColNames = new ArrayList<String>(Arrays.<String> asList(context.getString(
                GENERAL_COLUMNS, GENERAL_COLUMNS_DFLT).split(",")));
        XMLInputFactory inputFactory = XMLInputFactory.newInstance();
        try {
            r = inputFactory.createXMLStreamReader(new FlumeInputStream(in));
        } catch (XMLStreamException e) {
            logger.error("createXMLStreamReader failed: " + e.getMessage());
            this.isOpen = false;
        }
    }

    /**
     * Reads a XML file as a single event
     * 
     * @return Event containing parsed line
     * @throws IOException
     */
    @Override
    public Event readEvent() throws IOException {
        logger.error("Reading a single event from a XML stream is not supported! Try readEvents()!");
        return null;
    }

    /**
     * Batch line read
     * 
     * @param numEvents
     *            Maximum number of events to return.
     * @return List of events containing read lines
     * @throws IOException
     */
    @Override
    public List<Event> readEvents(int numEvents) throws IOException {
        List<Event> events = Lists.newLinkedList();
        ensureOpen();
        String output = "";
        try {
            int event = r.getEventType();
            while (true) {
                switch (event) {
                case XMLStreamConstants.START_DOCUMENT:
                    break;

                case XMLStreamConstants.START_ELEMENT:

                    // activate scope
                    String strEleName = r.getName().getLocalPart();
                    if (inMdScope) {
                        if (inMvScope) {
                            if (strEleName.equals(MYXML_MOID_ELEMENT)) {
                                moid = r.getElementText();
                            } else if (strEleName.equals(MYXML_R_ELEMENT)) {
                                String dataCell = r.getElementText();
                                if (dataCell == null || dataCell.isEmpty()) {
                                    dataCell = this.nullData;
                                }
                                dataCols.add(dataCell);
                            }
                        } else if (strEleName.equals(MYXML_MV_ELEMENT)) {
                            inMvScope = true;
                            dataCols = new ArrayList<String>();
                        } else if (strEleName.equals(MYXML_MT_ELEMENT)) {
                            if (firstColName.isEmpty()) {
                                firstColName = r.getElementText();
                            }
                        } else {
                            generalColumnsIndex = generalColNames.indexOf(strEleName);
                            if (generalColumnsIndex >= 0
                                    && generalColumnsIndex <= generalColNames.size()) {
                                generalCols.set(generalColumnsIndex, r.getElementText());
                            }
                        }
                    } else if (strEleName.equals(MYXML_MD_ELEMENT)) {
                        inMdScope = true;
                        // initialize general columns for each md
                        generalCols = new ArrayList<String>(generalColNames);
                    }

                    break;

                case XMLStreamConstants.CHARACTERS:
                    break;

                case XMLStreamConstants.END_ELEMENT:

                    // close scope
                    String strEndEle = r.getName().getLocalPart();

                    if (strEndEle.equals(MYXML_MD_ELEMENT)) {
                        inMdScope = false;
                        firstColName = "";
                    } else if (strEndEle.equals(MYXML_MV_ELEMENT)) {
                        inMvScope = false;
                        // build event

                        output = Joiner.on("|").useForNull(this.nullData).join(generalCols) + "|"
                                + moid + "|"
                                + Joiner.on("|").useForNull(this.nullData).join(dataCols);
                        Event objEvent = EventBuilder.withBody(output, outputCharset);
                        Map<String, String> headers = generateHeaders(generalColNames, generalCols);
                        headers.put("firstCol", firstColName);
                        objEvent.setHeaders(headers);
                        events.add(objEvent);
                        moid = "";
                    }

                    break;

                case XMLStreamConstants.END_DOCUMENT:

                    break;
                }

                if (!r.hasNext())
                    break;

                event = r.next();

                if (events.size() >= numEvents) {
                    break;
                }
            }
        } catch (XMLStreamException e) {
            logger.error(e.getMessage());
        }
        return events;
    }

    @Override
    public void mark() throws IOException {
        ensureOpen();
        in.mark();
    }

    @Override
    public void reset() throws IOException {
        ensureOpen();
        in.reset();
    }

    @Override
    public void close() throws IOException {
        if (isOpen) {
            reset();
            in.close();
            try {
                r.close();
            } catch (XMLStreamException e) {
                logger.error("XML close error: " + e.getMessage());
            }
            isOpen = false;
        }
    }

    private Map<String, String> generateHeaders(List<String> keys, List<String> values) {
        Map<String, String> map = Maps.newHashMap();
        for (int i = 0; i < keys.size(); i++) {
            if (keys.get(i).equals("mts")) {
                Date d;
                try {
                    d = (new SimpleDateFormat("yyyyMMddHHmmssX").parse(values.get(i)));
                    map.put("timestamp", String.valueOf(d.getTime()));
                } catch (ParseException e) {
                    logger.error("Parse timestamp error: " + e.getMessage());
                }
            } else {
                map.put(keys.get(i), values.get(i));
            }
        }
        return map;
    }

    private void ensureOpen() {
        if (!isOpen) {
            throw new IllegalStateException("Serializer has been closed");
        }
    }

    public static class Builder implements EventDeserializer.Builder {

        @Override
        public EventDeserializer build(Context context, ResettableInputStream in) {
            return new MyXMLDeserializer(context, in);
        }

    }
}
