  import http from 'k6/http';
  import { check, sleep } from 'k6';

  const BASE_URL =
    __ENV.BASE_URL ||
    'http://smart-lamp-alb-226050180.eu-north-1.elb.amazonaws.com';

  const USERS = Number(__ENV.USERS || 10);

  export const options = {
    stages: [
      { duration: '3m', target: USERS },
      { duration: '5m', target: USERS },
      { duration: '2m', target: 0 },
    ],

    summaryTrendStats: [
      'avg',
      'min',
      'med',
      'p(95)',
      'p(99)',
      'max',
    ],

    thresholds: {
      http_req_failed: ['rate<0.05'],
    },
  };

  export default function () {
    const preset = {
      name: `load-test-${__VU}-${__ITER}-${Date.now()}`,
      color: '#FF0000',
      brightness: 75,
    };

    const createResponse = http.post(
      `${BASE_URL}/api/presets`,
      JSON.stringify(preset),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    check(createResponse, {
      'Preset created (201)': (r) => r.status === 201,
    });

    let createdId = null;

    if (createResponse.status === 201) {
      try {
        createdId = createResponse.json('id');
      } catch (error) {
      }
    }

    check(createdId, {
      'Created preset has ID': (id) =>
        Number.isInteger(id) && id > 0,
    });

    for (let i = 0; i < 5; i++) {
      const response = http.get(`${BASE_URL}/api/presets`);

      check(response, {
        'Presets returned (200)': (r) => r.status === 200,
      });

      if (i === 0 && createdId !== null && response.status === 200) {
        let found = false;

        try {
          const presets = response.json();
          found =
            Array.isArray(presets) &&
            presets.some((item) => item.id === createdId);
        } catch (error) {
          found = false;
        }

        check(found, {
          'New preset found in list': (value) => value === true,
        });
      }
    }

    for (let i = 0; i < 2; i++) {
      const response = http.get(`${BASE_URL}/api/device-logs`);

      check(response, {
        'Device logs returned (200)': (r) => r.status === 200,
      });
    }

    for (let i = 0; i < 2; i++) {
      const response = http.get(`${BASE_URL}/api/sensor`);

      check(response, {
        'Sensor data returned (200)': (r) => r.status === 200,
      });
    }

    sleep(1);
  }
