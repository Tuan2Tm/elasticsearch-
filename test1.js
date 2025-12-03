/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
/* eslint-disable no-loop-func */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */

import { Client } from '@elastic/elasticsearch';
import logger from '../../utils/logger.js';
import orderModel from '../models/orderModel.js';

const client = (() => {
  try {
    const c = new Client({
      node: process.env.ELASTIC_SEARCH_URL,
      // Nếu có auth:
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD
      }
    });

    console.log('✅ Elasticsearch connect success');
    return c;
  }
  catch (error) {
    console.log('❌ ES Connect error:', error);
    logger.error(error);
    return null;
  }
})();

export const createIndexIfNotExists = async () => {
  try {
    const exists = await client.indices.exists({ index: 'orders' });

    if (exists) {
      console.log('✅ Index "orders" đã tồn tại');
      return true;
    }

    console.log('📝 Đang tạo index "orders"...');

    await client.indices.create({
      index: 'orders',
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          'index.max_ngram_diff': 20,

          analysis: {
            tokenizer: {
              ngram_tokenizer: {
                type: 'ngram',
                min_gram: 2,
                max_gram: 10,
                token_chars: ['letter', 'digit']
              }
            },
            analyzer: {
              ngram_analyzer: {
                tokenizer: 'ngram_tokenizer',
                filter: ['lowercase', 'asciifolding']
              },
              keyword_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding']
              }
            },
            normalizer: {
              lowercase_normalizer: {
                type: 'custom',
                filter: ['lowercase', 'asciifolding']
              }
            }
          }
        },

        mappings: {
          properties: {
            orderId: { type: 'keyword' },

            orderNameXPwId: {
              type: 'text',
              analyzer: 'ngram_analyzer',
              search_analyzer: 'standard',
              fields: {
                raw: { type: 'keyword' }
              }
            },

            shippingName: {
              type: 'text',
              analyzer: 'ngram_analyzer',
              search_analyzer: 'standard',
              fields: {
                raw: { type: 'keyword' }
              }
            },

            sellerId: { type: 'keyword' },

            sellerEmail: {
              type: 'text',
              analyzer: 'keyword_analyzer',
              fields: {
                raw: { type: 'keyword' },
                lowercase: { type: 'keyword', normalizer: 'lowercase_normalizer' }
              }
            },

            keywordSearch: {
              type: 'text',
              analyzer: 'ngram_analyzer',
              search_analyzer: 'standard',
              fields: {
                raw: { type: 'keyword' },
                lowercase: {
                  type: 'keyword',
                  normalizer: 'lowercase_normalizer'
                }
              }
            }
          }
        }
      }
    });

    console.log('✅ Đã tạo index "orders" thành công!');
    return true;
  }
  catch (error) {
    console.error('❌ Lỗi khi tạo index:', error.meta?.body?.error || error);
    return false;
  }
};

export const syncOrderToES = async (order) => {
  try {
    const id = order._id.toString();

    const doc = {
      orderId: id,
      orderNameXPwId: order.orderNameXPwId,
      shippingName: order.shippingAddress?.shippingName ?? '',
      sellerId: order.userId,
      sellerEmail: order.userData?.email ?? '',

      keywordSearch: [
        order.orderNameXPwId,
        order.shippingAddress?.shippingName
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
    };

    await client.index({
      index: 'orders',
      // id,
      document: doc
    });

    return { success: true };
  }
  catch (error) {
    console.error(`❌ ERROR sync order ${order._id}:`, error.meta?.body?.error || error);
    return { success: false, error: error.message };
  }
};

export const syncAllBatch = async () => {
  const concurrentSize = 1000;
  const startTime = Date.now();
  const BATCH_SIZE = 100000;

  console.log('🚀 Bắt đầu đồng bộ dữ liệu (Batch mode)...');

  const totalOrders = await orderModel.countDocuments({});
  console.log(`📦 Tổng số orders cần đồng bộ: ${totalOrders}`);

  let syncedCount = 0;
  let errorCount = 0;
  let skip = 0;

  await createIndexIfNotExists();

  while (skip < totalOrders) {
    const orders = await orderModel.find().skip(skip).limit(BATCH_SIZE).select('shippingAddress orderNameXPwId userData userId')
      .lean();
    if (!orders.length) break;

    for (let i = 0; i < orders.length; i += concurrentSize) {
      const chunk = orders.slice(i, i + concurrentSize);

      const results = await Promise.all(chunk.map((o) => syncOrderToES(o)));

      results.forEach((r) => {
        if (r.success) syncedCount++;
        else errorCount++;
      });

      const percent = Math.floor((syncedCount / totalOrders) * 100);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      const avgTime = (elapsed / syncedCount).toFixed(3);
      const remaining = ((totalOrders - syncedCount) * avgTime).toFixed(2);

      console.log(
        `⏳ Tiến độ: ${percent}% (${syncedCount}/${totalOrders}) | `
          + `⏱ ${elapsed}s | `
          + `Còn lại: ~${remaining}s | `
          + `❌ Lỗi: ${errorCount}`
      );
    }

    skip += BATCH_SIZE;

    if (skip % 500 === 0) {
      try {
        await client.indices.refresh({ index: 'orders' });
        console.log('🔄 Refresh index');
      }
      catch (e) {
        console.log('⚠️ Refresh fail:', e.message);
      }
    }
  }

  try {
    await client.indices.refresh({ index: 'orders' });
  }
  catch (e) {
    console.log('⚠️ Refresh cuối bị lỗi:', e.message);
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n🎉 HOÀN TẤT ĐỒNG BỘ');
  console.log(`   ✔ Thành công: ${syncedCount}`);
  console.log(`   ❌ Thất bại: ${errorCount}`);
  console.log(`   ⏱ Thời gian: ${totalTime}s`);
  console.log(`   ⚡ Tốc độ: ${(syncedCount / totalTime).toFixed(2)} orders/s`);

  return {
    syncedCount,
    errorCount,
    totalTime
  };
};
