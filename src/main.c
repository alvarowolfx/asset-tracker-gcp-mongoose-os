
#include <stdio.h>

#include "common/mbuf.h"
#include "common/platform.h"
#include "mgos_app.h"
#include "mgos_gpio.h"
#include "mgos_timers.h"
#include "mgos_uart.h"
#include "common/json_utils.h"

#include "mgos.h"
#include "minmea.h"

#define GPS_UART 2
static size_t gpsDataAvailable = 0;
static struct minmea_sentence_rmc lastFrame;

char *get_lat_lon()
{

  struct mbuf fb;
  struct json_out out = JSON_OUT_MBUF(&fb);

  //printf("GPS Request direct \n");

  mbuf_init(&fb, 50);

  float lat = minmea_tocoord(&lastFrame.latitude);
  float lon = minmea_tocoord(&lastFrame.longitude);
  float speed = minmea_tocoord(&lastFrame.speed);

  if (lat == NAN)
  {
    lat = 0.0f;
  }

  if (lon == NAN)
  {
    lon = 0.0f;
  }

  if (speed == NAN)
  {
    speed = 0.0f;
  }

  json_printf(&out, "{lat: \"%f\", lon: \"%f\", sp: \"%f\"}", lat, lon, speed);

  //mbuf_free(&fb);

  return fb.buf;
}

static void parseGpsData(char *line)
{
  char lineNmea[MINMEA_MAX_LENGTH];
  strncpy(lineNmea, line, sizeof(lineNmea) - 1);
  strcat(lineNmea, "\n");
  lineNmea[sizeof(lineNmea) - 1] = '\0';

  enum minmea_sentence_id id = minmea_sentence_id(lineNmea, false);
  //printf("sentence id = %d from line %s\n", (int) id, lineNmea);
  switch (id)
  {
  case MINMEA_SENTENCE_RMC:
  {
    struct minmea_sentence_rmc frame;
    if (minmea_parse_rmc(&frame, lineNmea))
    {
      lastFrame = frame;
      /*
      printf("$RMC: raw coordinates and speed: (%d/%d,%d/%d) %d/%d\n",
             frame.latitude.value, frame.latitude.scale,
             frame.longitude.value, frame.longitude.scale,
             frame.speed.value, frame.speed.scale);
      printf("$RMC fixed-point coordinates and speed scaled to three decimal places: (%d,%d) %d\n",
             minmea_rescale(&frame.latitude, 1000),
             minmea_rescale(&frame.longitude, 1000),
             minmea_rescale(&frame.speed, 1000));
      printf("$RMC floating point degree coordinates and speed: (%f,%f) %f\n",
             minmea_tocoord(&frame.latitude),
             minmea_tocoord(&frame.longitude),
             minmea_tofloat(&frame.speed));
      */
    }
  }
  break;

  case MINMEA_SENTENCE_GGA:
  {
    struct minmea_sentence_gga frame;
    if (minmea_parse_gga(&frame, lineNmea))
    {
      printf("$GGA: fix quality: %d\n", frame.fix_quality);
    }
  }
  break;

  case MINMEA_SENTENCE_GSV:
  {
    struct minmea_sentence_gsv frame;
    if (minmea_parse_gsv(&frame, lineNmea))
    {
      //printf("$GSV: message %d of %d\n", frame.msg_nr, frame.total_msgs);
      printf("$GSV: sattelites in view: %d\n", frame.total_sats);
      /*for (int i = 0; i < 4; i++)
        printf("$GSV: sat nr %d, elevation: %d, azimuth: %d, snr: %d dbm\n",
               frame.sats[i].nr,
               frame.sats[i].elevation,
               frame.sats[i].azimuth,
               frame.sats[i].snr);
      */
    }
  }
  break;
  case MINMEA_INVALID:
  {
    break;
  }
  case MINMEA_UNKNOWN:
  {
    break;
  }
  case MINMEA_SENTENCE_GSA:
  {
    break;
  }
  case MINMEA_SENTENCE_GLL:
  {
    break;
  }
  case MINMEA_SENTENCE_GST:
  {
    break;
  }
  case MINMEA_SENTENCE_VTG:
  {
    break;
  }
  case MINMEA_SENTENCE_ZDA:
  {
    break;
  }
  }
}

static void gps_read_cb(void *arg)
{

  //printf("Hello, GPS!\r\n");
  if (gpsDataAvailable > 0)
  {
    struct mbuf rxb;
    mbuf_init(&rxb, 0);
    mgos_uart_read_mbuf(GPS_UART, &rxb, gpsDataAvailable);
    if (rxb.len > 0)
    {
      char *pch;
      //printf("%.*s", (int) rxb.len, rxb.buf);
      pch = strtok(rxb.buf, "\n");
      while (pch != NULL)
      {
        //printf("GPS lineNmea: %s\n", pch);
        parseGpsData(pch);
        pch = strtok(NULL, "\n");
      }
    }
    mbuf_free(&rxb);

    gpsDataAvailable = 0;
  }

  (void)arg;
}

int esp32_uart_rx_fifo_len(int uart_no);

static void uart_dispatcher(int uart_no, void *arg)
{
  assert(uart_no == GPS_UART);
  size_t rx_av = mgos_uart_read_avail(uart_no);
  if (rx_av > 0)
  {
    gpsDataAvailable = rx_av;
  }
  (void)arg;
}

enum mgos_app_init_result mgos_app_init(void)
{

  struct mgos_uart_config ucfg;
  mgos_uart_config_set_defaults(GPS_UART, &ucfg);

  ucfg.baud_rate = 9600;
  ucfg.num_data_bits = 8;
  //ucfg.parity = MGOS_UART_PARITY_NONE;
  //ucfg.stop_bits = MGOS_UART_STOP_BITS_1;
  if (!mgos_uart_configure(GPS_UART, &ucfg))
  {
    return MGOS_APP_INIT_ERROR;
  }

  mgos_set_timer(2000 /* ms */, true /* repeat */, gps_read_cb, NULL /* arg */);

  mgos_uart_set_dispatcher(GPS_UART, uart_dispatcher, NULL /* arg */);
  mgos_uart_set_rx_enabled(GPS_UART, true);

  return MGOS_APP_INIT_SUCCESS;
}
