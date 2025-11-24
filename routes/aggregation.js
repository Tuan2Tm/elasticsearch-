import express from 'express';
import client from '../config/elasticsearch.js';

const router = express.Router();

// 1. 基础聚合 - 统计
router.post('/stats', async (req, res) => {
  try {
    const { index = 'orders', field } = req.body;

    if (!field) {
      return res.status(400).json({ error: 'field 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          stats: {
            stats: {
              field
            }
          }
        }
      }
    });

    res.json({
      field,
      stats: response.aggregations.stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. 术语聚合（分组统计）
router.post('/terms', async (req, res) => {
  try {
    const { index = 'orders', field, size = 10 } = req.body;

    if (!field) {
      return res.status(400).json({ error: 'field 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          terms_agg: {
            terms: {
              field,
              size
            }
          }
        }
      }
    });

    res.json({
      field,
      buckets: response.aggregations.terms_agg.buckets
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. 日期直方图聚合
router.post('/date-histogram', async (req, res) => {
  try {
    const { index = 'orders', field, interval = 'day', format } = req.body;

    if (!field) {
      return res.status(400).json({ error: 'field 是必需的' });
    }

    const dateHistogram = {
      field,
      calendar_interval: interval
    };

    if (format) {
      dateHistogram.format = format;
    }

    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          date_histogram: {
            date_histogram: dateHistogram
          }
        }
      }
    });

    res.json({
      field,
      buckets: response.aggregations.date_histogram.buckets
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. 范围聚合
router.post('/range', async (req, res) => {
  try {
    const { index = 'orders', field, ranges } = req.body;

    if (!field || !Array.isArray(ranges)) {
      return res.status(400).json({ error: 'field 和 ranges (数组) 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          range_agg: {
            range: {
              field,
              ranges
            }
          }
        }
      }
    });

    res.json({
      field,
      buckets: response.aggregations.range_agg.buckets
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. 嵌套聚合（多级聚合）
router.post('/nested', async (req, res) => {
  try {
    const { index = 'orders', aggregations } = req.body;

    if (!aggregations) {
      return res.status(400).json({ error: 'aggregations 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: aggregations
      }
    });

    res.json({
      aggregations: response.aggregations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. 百分位数聚合
router.post('/percentiles', async (req, res) => {
  try {
    const { index = 'orders', field, percents } = req.body;

    if (!field) {
      return res.status(400).json({ error: 'field 是必需的' });
    }

    const percentiles = {
      field
    };

    if (percents) {
      percentiles.percents = percents;
    }

    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          percentiles: {
            percentiles: percentiles
          }
        }
      }
    });

    res.json({
      field,
      values: response.aggregations.percentiles.values
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. 基数聚合（唯一值计数）
router.post('/cardinality', async (req, res) => {
  try {
    const { index = 'orders', field } = req.body;

    if (!field) {
      return res.status(400).json({ error: 'field 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          unique_count: {
            cardinality: {
              field
            }
          }
        }
      }
    });

    res.json({
      field,
      unique_count: response.aggregations.unique_count.value
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. 平均值聚合
router.post('/avg', async (req, res) => {
  try {
    const { index = 'orders', field } = req.body;

    if (!field) {
      return res.status(400).json({ error: 'field 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          average: {
            avg: {
              field
            }
          }
        }
      }
    });

    res.json({
      field,
      average: response.aggregations.average.value
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. 最大值/最小值聚合
router.post('/min-max', async (req, res) => {
  try {
    const { index = 'orders', field } = req.body;

    if (!field) {
      return res.status(400).json({ error: 'field 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          min_value: {
            min: {
              field
            }
          },
          max_value: {
            max: {
              field
            }
          }
        }
      }
    });

    res.json({
      field,
      min: response.aggregations.min_value.value,
      max: response.aggregations.max_value.value
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. 总和聚合
router.post('/sum', async (req, res) => {
  try {
    const { index = 'orders', field } = req.body;

    if (!field) {
      return res.status(400).json({ error: 'field 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          total: {
            sum: {
              field
            }
          }
        }
      }
    });

    res.json({
      field,
      sum: response.aggregations.total.value
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. 地理边界聚合
router.post('/geo-bounds', async (req, res) => {
  try {
    const { index = 'orders', field } = req.body;

    if (!field) {
      return res.status(400).json({ error: 'field 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          geo_bounds: {
            geo_bounds: {
              field
            }
          }
        }
      }
    });

    res.json({
      field,
      bounds: response.aggregations.geo_bounds.bounds
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 12. 复合聚合（多字段分组）
router.post('/composite', async (req, res) => {
  try {
    const { index = 'orders', sources, size = 10 } = req.body;

    if (!sources || !Array.isArray(sources)) {
      return res.status(400).json({ error: 'sources (数组) 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          composite_agg: {
            composite: {
              sources,
              size
            }
          }
        }
      }
    });

    res.json({
      buckets: response.aggregations.composite_agg.buckets,
      after_key: response.aggregations.composite_agg.after_key
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

