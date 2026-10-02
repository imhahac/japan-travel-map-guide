/**
 * =========================================================================
 * 日本平價美食與人氣連鎖餐廳模組 (Dining Scraper & Multi-Brand Module)
 * =========================================================================
 * 收錄全日本台灣旅客最熱門之 10 大日式連鎖餐飲名店：
 * 1. 一蘭拉麵 (天然豚骨拉麵，全量 86 間官方直營)
 * 2. 一風堂 (博多豚骨白丸/赤丸，全量 156 間官方直營)
 * 3. 三大牛丼：吉野家 (Yoshinoya)、松屋 (Matsuya)、すき家 (Sukiya)
 * 4. 迴轉壽司雙雄：壽司郎 (Sushiro)、藏壽司 (Kura Sushi)
 * 5. 日式定食連鎖：やよい軒 (彌生軒)、大戶屋 (Ootoya)
 * 6. 名古屋喫茶：客美多咖啡 (Komeda's Coffee)
 */

import fs from 'fs';
import path from 'path';
import { findNearestStation } from '../core/geo.js';
import { validateSpotsBatch } from '../core/validator.js';
import { deduplicateSpots } from '../core/dedupe.js';

// =========================================================================
// 1. 三大牛丼：吉野家 (Yoshinoya)
// =========================================================================
export const YOSHINOYA_SEED = [
  // 首都圈
  {
    code: 'yosh-shinjuku-east',
    brand: '吉野家',
    name: '吉野家 新宿東口店',
    nameJa: '吉野家 新宿東口店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区新宿3-23-11',
    lat: 35.6928,
    lng: 139.7015,
    phone: '03-5363-2280',
    is24Hours: true,
    url: 'https://stores.yoshinoya.com/yoshinoya/spot/detail?code=0000000001',
    tags: ['24小時營業', '百年經典牛丼', '新宿商圈', '朝食定食'],
    notes: 'JR 新宿站東口出站步行 2 分鐘，24 小時深夜營業，百年秘傳牛肉丼與朝食定食。'
  },
  {
    code: 'yosh-shibuya-ekimae',
    brand: '吉野家',
    name: '吉野家 澀谷站前店',
    nameJa: '吉野家 渋谷駅前店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区道玄坂1-3-1',
    lat: 35.6588,
    lng: 139.6998,
    phone: '03-5459-2511',
    is24Hours: true,
    url: 'https://stores.yoshinoya.com/',
    tags: ['24小時營業', '澀谷八公口旁', '特美辣牛肉飯'],
    notes: 'JR 澀谷站八公口步行 1 分鐘，出站用餐極度便捷。'
  },
  {
    code: 'yosh-ikebukuro-east',
    brand: '吉野家',
    name: '吉野家 池袋東口店',
    nameJa: '吉野家 池袋東口店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都豊島区東池袋1-2-6',
    lat: 35.7302,
    lng: 139.7135,
    phone: '03-5953-6110',
    is24Hours: true,
    url: 'https://stores.yoshinoya.com/',
    tags: ['24小時營業', '池袋東口步行2分', '深夜供餐'],
    notes: '池袋繁華商圈 24 小時深夜供餐首選。'
  },
  {
    code: 'yosh-akihabara-chuo',
    brand: '吉野家',
    name: '吉野家 秋葉原中央通店',
    nameJa: '吉野家 秋葉原中央通り店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都千代田区外神田1-13-3',
    lat: 35.6988,
    lng: 139.7712,
    phone: '03-5297-6211',
    is24Hours: true,
    url: 'https://stores.yoshinoya.com/',
    tags: ['24小時營業', '秋葉原電氣街口', '動漫聖地'],
    notes: '秋葉原電氣街口旁，動漫周邊商場逛街後平價用餐。'
  },
  {
    code: 'yosh-ueno-ekimae',
    brand: '吉野家',
    name: '吉野家 上野站前店',
    nameJa: '吉野家 上野駅前店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区上野6-16-16',
    lat: 35.7118,
    lng: 139.7762,
    phone: '03-5807-7210',
    is24Hours: true,
    url: 'https://stores.yoshinoya.com/',
    tags: ['24小時營業', '阿美橫丁入口', '上野站直通'],
    notes: '上野站廣小路口對面，阿美橫町逛街前哨站。'
  },
  {
    code: 'yosh-ginza-4chome',
    brand: '吉野家',
    name: '吉野家 銀座四丁目店',
    nameJa: '吉野家 銀座四丁目店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都中央区銀座4-4-1',
    lat: 35.6715,
    lng: 139.7655,
    phone: '03-3561-1210',
    is24Hours: true,
    url: 'https://stores.yoshinoya.com/',
    tags: ['24小時營業', '銀座晴海通', '精品商圈平價首選'],
    notes: '銀座四丁目交差點步行 1 分鐘，銀座區難得的平價 24 小時美食。'
  },
  {
    code: 'yosh-asakusa-ekimae',
    brand: '吉野家',
    name: '吉野家 淺草站前店',
    nameJa: '吉野家 浅草駅前店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区浅草1-1-17',
    lat: 35.7118,
    lng: 139.7972,
    phone: '03-5827-2110',
    is24Hours: true,
    url: 'https://stores.yoshinoya.com/',
    tags: ['24小時營業', '淺草雷門旁', '東武淺草站'],
    notes: '東武淺草站與東京地鐵淺草站出口直達，雷門步行 1 分鐘。'
  },
  // 關西
  {
    code: 'yosh-osaka-namba',
    brand: '吉野家',
    name: '吉野家 難波戎橋店',
    nameJa: '吉野家 なんば戎橋店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区難波3-2-25',
    lat: 34.6675,
    lng: 135.5015,
    phone: '06-6635-1510',
    is24Hours: true,
    url: 'https://stores.yoshinoya.com/',
    tags: ['24小時營業', '戎橋商店街內', '難波站步行2分'],
    notes: '南海難波與地鐵難波站旁，高人氣平價美食。'
  },
  {
    code: 'yosh-umeda-ekimae',
    brand: '吉野家',
    name: '吉野家 梅田太融寺店',
    nameJa: '吉野家 梅田太融寺店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市北区太融寺町5-15',
    lat: 34.7018,
    lng: 135.5028,
    phone: '06-6311-6110',
    is24Hours: true,
    url: 'https://stores.yoshinoya.com/',
    tags: ['24小時營業', '梅田地下街旁', '深夜食堂'],
    notes: '鄰近東梅田站與 Whity 地下街，24 小時暖心供餐。'
  },
  {
    code: 'yosh-shinsaibashi',
    brand: '吉野家',
    name: '吉野家 心齋橋南店',
    nameJa: '吉野家 心斎橋南店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区心斎橋筋2-6-14',
    lat: 34.6698,
    lng: 135.5015,
    phone: '06-6214-2210',
    is24Hours: true,
    url: 'https://stores.yoshinoya.com/',
    tags: ['24小時營業', '心齋橋商店街', '道頓堀跑跑人旁'],
    notes: '心齋橋筋與道頓堀交會處，逛街血拼體力補充首選。'
  },
  {
    code: 'yosh-kyoto-ekimae',
    brand: '吉野家',
    name: '吉野家 京都站前店',
    nameJa: '吉野家 京都駅前店',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市下京区烏丸通七条下ル東塩小路町718',
    lat: 34.9875,
    lng: 135.7592,
    phone: '075-353-6881',
    is24Hours: true,
    url: 'https://stores.yoshinoya.com/',
    tags: ['24小時營業', '京都站烏丸口步行2分', '早晨朝食'],
    notes: 'JR 京都站正對面，早班車出發前享用日式朝食最理想。'
  },
  // 九州・沖繩・北海道
  {
    code: 'yosh-hakata-chikushi',
    brand: '吉野家',
    name: '吉野家 博多站筑紫口店',
    nameJa: '吉野家 博多駅筑紫口店',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市博多区博多駅中央街1-1',
    lat: 33.5898,
    lng: 130.4215,
    phone: '092-432-8810',
    is24Hours: true,
    url: 'https://stores.yoshinoya.com/',
    tags: ['24小時營業', '新幹線筑紫口直達', '早餐定食'],
    notes: '博多新幹線口出站即達，九州鐵道旅行出發必備。'
  },
  {
    code: 'yosh-tenjin-chuo',
    brand: '吉野家',
    name: '吉野家 福岡天神店',
    nameJa: '吉野家 福岡天神店',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市中央区天神2-8-22',
    lat: 33.5912,
    lng: 130.3985,
    phone: '092-737-1210',
    is24Hours: true,
    url: 'https://stores.yoshinoya.com/',
    tags: ['24小時營業', '西鐵天神站直達', '天神商圈'],
    notes: '西鐵福岡（天神）站旁，地下鐵天神站直達。'
  },
  {
    code: 'yosh-naha-kokusai',
    brand: '吉野家',
    name: '吉野家 那霸國際通店',
    nameJa: '吉野家 国際通り店',
    region: '九州・沖繩',
    prefecture: '沖繩縣',
    address: '沖縄県那覇市牧志2-1-1',
    lat: 26.2165,
    lng: 127.6872,
    phone: '098-860-1210',
    is24Hours: true,
    url: 'https://stores.yoshinoya.com/',
    tags: ['24小時營業', '沖繩限定Taco Rice', '國際通核心'],
    notes: '沖繩獨家提供塔可飯 (Taco Rice) 與限定套餐，單軌牧志站旁。'
  },
  {
    code: 'yosh-sapporo-ekimae',
    brand: '吉野家',
    name: '吉野家 札幌站北口店',
    nameJa: '吉野家 札幌駅北口店',
    region: '北海道・東北',
    prefecture: '北海道',
    address: '北海道札幌市北区北7条西4丁目3-1',
    lat: 43.0695,
    lng: 141.3505,
    phone: '011-738-1210',
    is24Hours: true,
    url: 'https://stores.yoshinoya.com/',
    tags: ['24小時營業', '札幌站北口直達', '暖胃牛肉鍋'],
    notes: 'JR 札幌站北口出站 1 分鐘，冬季雪季熱騰騰牛肉壽喜燒鍋。'
  }
];

// =========================================================================
// 2. 三大牛丼：松屋 (Matsuya)
// =========================================================================
export const MATSUYA_SEED = [
  {
    code: 'matsuya-shinjuku-kabuki',
    brand: '松屋',
    name: '松屋 歌舞伎町店',
    nameJa: '松屋 歌舞伎町店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区歌舞伎町1-6-3',
    lat: 35.6942,
    lng: 139.7018,
    phone: '03-5292-6210',
    is24Hours: true,
    url: 'https://pkg.navitime.co.jp/matsuyafoods/',
    tags: ['24小時營業', '免費附味噌湯', '蔥香鹽味豬肉丼', '漢堡排定食'],
    notes: '新宿歌舞伎町入口，店內用餐皆附免費味噌湯，各式定食與咖哩飯。'
  },
  {
    code: 'matsuya-shibuya-chuo',
    brand: '松屋',
    name: '松屋 澀谷中央通店',
    nameJa: '松屋 渋谷中央通り店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区宇田川町24-4',
    lat: 35.6602,
    lng: 139.6995,
    phone: '03-5459-1210',
    is24Hours: true,
    url: 'https://pkg.navitime.co.jp/matsuyafoods/',
    tags: ['24小時營業', '澀谷十字路口旁', '自助售票機支援中文'],
    notes: '澀谷中心街入口，外國旅客使用觸控點餐機超方便。'
  },
  {
    code: 'matsuya-ikebukuro-sunshine',
    brand: '松屋',
    name: '松屋 池袋太陽城通店',
    nameJa: '松屋 サンシャイン通り店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都豊島区東池袋1-14-1',
    lat: 35.7305,
    lng: 139.7145,
    phone: '03-5956-1210',
    is24Hours: true,
    url: 'https://pkg.navitime.co.jp/matsuyafoods/',
    tags: ['24小時營業', '太陽城60通', '平價排餐定食'],
    notes: '池袋東口太陽城通上，經典鐵板牛肉定食與招牌漢堡排。'
  },
  {
    code: 'matsuya-akihabara-ekimae',
    brand: '松屋',
    name: '松屋 秋葉原店',
    nameJa: '松屋 秋葉原店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都千代田区外神田4-4-2',
    lat: 35.7008,
    lng: 139.7715,
    phone: '03-5297-1210',
    is24Hours: true,
    url: 'https://pkg.navitime.co.jp/matsuyafoods/',
    tags: ['24小時營業', '秋葉原中央通', '平價深夜補給'],
    notes: '秋葉原中央通上，營業 24 小時無休。'
  },
  {
    code: 'matsuya-ueno-hirokouji',
    brand: '松屋',
    name: '松屋 上野廣小路店',
    nameJa: '松屋 上野広小路店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区上野2-1-9',
    lat: 35.7082,
    lng: 139.7725,
    phone: '03-5818-1210',
    is24Hours: true,
    url: 'https://pkg.navitime.co.jp/matsuyafoods/',
    tags: ['24小時營業', '上野廣小路站直結', '生薑燒肉定食'],
    notes: '地下鐵上野廣小路站與松坂屋旁，阿美橫町購物周邊。'
  },
  {
    code: 'matsuya-osaka-namba-chuo',
    brand: '松屋',
    name: '松屋 難波千日前店',
    nameJa: '松屋 なんば千日前店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区難波千日前13-11',
    lat: 34.6662,
    lng: 135.5025,
    phone: '06-6630-1210',
    is24Hours: true,
    url: 'https://pkg.navitime.co.jp/matsuyafoods/',
    tags: ['24小時營業', '千日前商店街', '牛肉飯免費附湯'],
    notes: '難波千日前核心，平價美味與香濃咖哩飯。'
  },
  {
    code: 'matsuya-umeda-chayamachi',
    brand: '松屋',
    name: '松屋 梅田茶屋町店',
    nameJa: '松屋 梅田茶屋町店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市北区茶屋町2-16',
    lat: 34.7048,
    lng: 135.4998,
    phone: '06-6377-1210',
    is24Hours: true,
    url: 'https://pkg.navitime.co.jp/matsuyafoods/',
    tags: ['24小時營業', '阪急梅田站旁', '茶屋町商圈'],
    notes: '阪急梅田站茶屋町口出站 1 分鐘，購物逛街便利。'
  },
  {
    code: 'matsuya-kyoto-shijo',
    brand: '松屋',
    name: '松屋 四條河原町店',
    nameJa: '松屋 四条河原町店',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市中京区河原町通蛸薬師上る奈良屋町297',
    lat: 35.0062,
    lng: 135.7698,
    phone: '075-257-1210',
    is24Hours: true,
    url: 'https://pkg.navitime.co.jp/matsuyafoods/',
    tags: ['24小時營業', '四條河原町繁華街', '平價定食'],
    notes: '京都河原町大街上，深夜散策與早餐朝食首選。'
  },
  {
    code: 'matsuya-nagoya-meieki',
    brand: '松屋',
    name: '松屋 名古屋名驛店',
    nameJa: '松屋 名駅二丁目店',
    region: '中部',
    prefecture: '愛知縣',
    address: '愛知県名古屋市中村区名駅2-44-2',
    lat: 35.1725,
    lng: 136.8835,
    phone: '052-589-1210',
    is24Hours: true,
    url: 'https://pkg.navitime.co.jp/matsuyafoods/',
    tags: ['24小時營業', '名古屋站櫻通口', '新幹線中繼'],
    notes: 'JR 名古屋站櫻通口步行 3 分鐘，交通位置便利。'
  },
  {
    code: 'matsuya-hakata-ekimae',
    brand: '松屋',
    name: '松屋 博多站前店',
    nameJa: '松屋 博多駅前店',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市博多区博多駅前3-2-8',
    lat: 33.5888,
    lng: 130.4175,
    phone: '092-433-1210',
    is24Hours: true,
    url: 'https://pkg.navitime.co.jp/matsuyafoods/',
    tags: ['24小時營業', '博多站博多口', '九州旅行平價好夥伴'],
    notes: 'JR 博多站博多口步行 3 分鐘，全天候平價定食與牛肉飯。'
  }
];

// =========================================================================
// 3. 三大牛丼：すき家 (Sukiya)
// =========================================================================
export const SUKIYA_SEED = [
  {
    code: 'sukiya-shinjuku-south',
    brand: 'すき家',
    name: 'すき家 新宿南口店',
    nameJa: 'すき家 新宿南口店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区西新宿1-18-5',
    lat: 35.6888,
    lng: 139.6992,
    phone: '0120-498-007',
    is24Hours: true,
    url: 'https://maps.sukiya.jp/',
    tags: ['24小時營業', '三種起司牛丼', '新宿南口直達', '桌邊平板點餐'],
    notes: '新宿南口與甲州街道旁，高人氣三種起司牛丼與明太子美乃滋牛丼。'
  },
  {
    code: 'sukiya-shibuya-2chome',
    brand: 'すき家',
    name: 'すき家 澀谷二丁目店',
    nameJa: 'すき家 渋谷二丁目店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区渋谷2-19-17',
    lat: 35.6598,
    lng: 139.7042,
    phone: '0120-498-007',
    is24Hours: true,
    url: 'https://maps.sukiya.jp/',
    tags: ['24小時營業', '澀谷Hikarie旁', '鰻魚飯/日式定食'],
    notes: '澀谷 Hikarie 與宮下公園周邊，提供人氣鰻牛丼與多樣配菜。'
  },
  {
    code: 'sukiya-ikebukuro-sunshine',
    brand: 'すき家',
    name: 'すき家 池袋太陽城前店',
    nameJa: 'すき家 サンシャイン前店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都豊島区東池袋1-28-4',
    lat: 35.7312,
    lng: 139.7162,
    phone: '0120-498-007',
    is24Hours: true,
    url: 'https://maps.sukiya.jp/',
    tags: ['24小時營業', '太陽城水族館旁', '多樣化菜單'],
    notes: '池袋太陽城商場入口前，家庭旅客與親子用餐友善。'
  },
  {
    code: 'sukiya-ueno-chuo',
    brand: 'すき家',
    name: 'すき家 上野中央通店',
    nameJa: 'すき家 上野中央通り店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区上野4-9-6',
    lat: 35.7112,
    lng: 139.7738,
    phone: '0120-498-007',
    is24Hours: true,
    url: 'https://maps.sukiya.jp/',
    tags: ['24小時營業', '上野公園旁', '阿美橫丁周邊'],
    notes: '上野中央通旁，緊鄰京成上野站，搭 Skyliner 前填飽肚子首選。'
  },
  {
    code: 'sukiya-osaka-dotonbori',
    brand: 'すき家',
    name: 'すき家 道頓堀一丁目店',
    nameJa: 'すき家 道頓堀一丁目店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区道頓堀1-1-11',
    lat: 34.6688,
    lng: 135.5052,
    phone: '0120-498-007',
    is24Hours: true,
    url: 'https://maps.sukiya.jp/',
    tags: ['24小時營業', '日本橋站出口', '道頓堀東側'],
    notes: '地下鐵日本橋站出站即達，道頓堀觀光核心 24 小時美食。'
  },
  {
    code: 'sukiya-umeda-ohatsu',
    brand: 'すき家',
    name: 'すき家 梅田曾根崎店',
    nameJa: 'すき家 梅田お初天神店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市北区曽根崎2-11-20',
    lat: 34.7008,
    lng: 135.5005,
    phone: '0120-498-007',
    is24Hours: true,
    url: 'https://maps.sukiya.jp/',
    tags: ['24小時營業', '曾根崎御初天神通', '東梅田站旁'],
    notes: '御初天神商店街內，酒吧夜市熱鬧區域，深夜救星。'
  },
  {
    code: 'sukiya-kyoto-shijo-karasuma',
    brand: 'すき家',
    name: 'すき家 四條烏丸店',
    nameJa: 'すき家 四条烏丸店',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市下京区四条通室町東入函谷鉾町79',
    lat: 35.0035,
    lng: 135.7595,
    phone: '0120-498-007',
    is24Hours: true,
    url: 'https://maps.sukiya.jp/',
    tags: ['24小時營業', '地鐵四條站直通', '阪急烏丸站出口'],
    notes: '京都商務與交通樞紐四條烏丸，交通極為方便。'
  },
  {
    code: 'sukiya-fukuoka-nakasu',
    brand: 'すき家',
    name: 'すき家 中洲川端店',
    nameJa: 'すき家 中洲川端店',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市博多区中洲5-2-1',
    lat: 33.5945,
    lng: 130.4055,
    phone: '0120-498-007',
    is24Hours: true,
    url: 'https://maps.sukiya.jp/',
    tags: ['24小時營業', '中洲屋台街旁', '深夜熱食'],
    notes: '中洲川端站 2 號出口旁，體驗中洲夜生活後溫暖飽足。'
  },
  {
    code: 'sukiya-naha-makishi',
    brand: 'すき家',
    name: 'すき家 那霸國際通牧志店',
    nameJa: 'すき家 国際通り牧志店',
    region: '九州・沖繩',
    prefecture: '沖繩縣',
    address: '沖縄県那覇市牧志1-1-22',
    lat: 26.2162,
    lng: 127.6865,
    phone: '0120-498-007',
    is24Hours: true,
    url: 'https://maps.sukiya.jp/',
    tags: ['24小時營業', '國際通入口', '沖繩自駕搭車都合適'],
    notes: '國際通近縣廳前方向，24 小時營業，平板支援繁體中文點餐。'
  }
];

// =========================================================================
// 4. 迴轉壽司雙雄：壽司郎 (Sushiro / スシロー)
// =========================================================================
export const SUSHIRO_SEED = [
  {
    code: 'sushiro-shibuya-ekimae',
    brand: '壽司郎',
    name: '壽司郎 澀谷站前店',
    nameJa: 'スシロー 渋谷駅前店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区宇田川町23-5 ハイマンテン渋谷ビル 6F',
    lat: 35.6605,
    lng: 139.7002,
    phone: '03-5428-3560',
    is24Hours: false,
    url: 'https://www.akindo-sushiro.co.jp/',
    tags: ['都市型旗艦店', '澀谷十字路口旁', '平板中文點餐', '外國旅客超人氣'],
    notes: '澀谷十字路口旁大樓 6 樓，全日本最熱門壽司郎之一，食材極度新鮮。'
  },
  {
    code: 'sushiro-asakusa-rox',
    brand: '壽司郎',
    name: '壽司郎 淺草店',
    nameJa: 'スシロー 浅草ROX店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区浅草1-25-15 浅草ROX 4F',
    lat: 35.7135,
    lng: 139.7925,
    phone: '03-5830-7110',
    is24Hours: false,
    url: 'https://www.akindo-sushiro.co.jp/',
    tags: ['淺草觀光旗艦店', '淺草ROX商場', '筑波快線直通'],
    notes: '淺草 ROX 4 樓，參拜淺草寺與雷門後品嚐平價美味壽司首選。'
  },
  {
    code: 'sushiro-shinjuku-east',
    brand: '壽司郎',
    name: '壽司郎 新宿三丁目店',
    nameJa: 'スシロー 新宿三丁目店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区新宿3-13-3 新宿文化ビル B1F',
    lat: 35.6912,
    lng: 139.7052,
    phone: '03-5361-6020',
    is24Hours: false,
    url: 'https://www.akindo-sushiro.co.jp/',
    tags: ['新宿商圈', '伊勢丹百貨旁', '自動送餐軌道'],
    notes: '新宿三丁目站直達，地下 1 樓寬敞用餐區，伊勢丹百貨旁。'
  },
  {
    code: 'sushiro-ikebukuro-ekimae',
    brand: '壽司郎',
    name: '壽司郎 池袋站東口店',
    nameJa: 'スシロー 南池袋店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都豊島区南池袋1-16-18 4F',
    lat: 35.7278,
    lng: 139.7125,
    phone: '03-5985-1160',
    is24Hours: false,
    url: 'https://www.akindo-sushiro.co.jp/',
    tags: ['池袋東口西武百貨旁', '超人氣壽司', '預約優先'],
    notes: '池袋站東口西武百貨旁，交通方便，品項齊全。'
  },
  {
    code: 'sushiro-osaka-shinsaibashi',
    brand: '壽司郎',
    name: '壽司郎 心齋橋店',
    nameJa: 'スシロー 心斎橋店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区心斎橋筋1-5-24 蔵平ビル 2F',
    lat: 34.6725,
    lng: 135.5008,
    phone: '06-6258-3011',
    is24Hours: false,
    url: 'https://www.akindo-sushiro.co.jp/',
    tags: ['心齋橋商店街核心', '關西旗艦店', '中文平板點餐'],
    notes: '心齋橋筋商店街 2 樓，逛街購物後品嚐壽司首選。'
  },
  {
    code: 'sushiro-osaka-namba',
    brand: '壽司郎',
    name: '壽司郎 難波Acro-City店',
    nameJa: 'スシロー 難波アクロシティ店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市浪速区難波中2-10-70 パークス通り',
    lat: 34.6625,
    lng: 135.5015,
    phone: '06-6630-8110',
    is24Hours: false,
    url: 'https://www.akindo-sushiro.co.jp/',
    tags: ['難波商圈', '難波Parks旁', '南海難波站直達'],
    notes: '南海難波站與 Namba Parks 旁，搭乘機場特急前後便利享用。'
  },
  {
    code: 'sushiro-kyoto-kawaramachi',
    brand: '壽司郎',
    name: '壽司郎 京都四條河原町店',
    nameJa: 'スシロー 四条河原町店',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市下京区四条通小橋西入真町68 住友不動産京都ビル 7F',
    lat: 35.0035,
    lng: 135.7698,
    phone: '075-253-1110',
    is24Hours: false,
    url: 'https://www.akindo-sushiro.co.jp/',
    tags: ['京都四條河原町', '鴨川景觀', '阪急京都河原町站直結'],
    notes: '京都河原町住友不動產大樓 7 樓，居高臨下，近祇園與錦市場。'
  },
  {
    code: 'sushiro-fukuoka-hakata',
    brand: '壽司郎',
    name: '壽司郎 博多站筑紫口店',
    nameJa: 'スシロー 博多駅筑紫口店',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市博多区博多駅東1-12-1 2F',
    lat: 33.5902,
    lng: 130.4225,
    phone: '092-433-8110',
    is24Hours: false,
    url: 'https://www.akindo-sushiro.co.jp/',
    tags: ['新幹線博多站筑紫口直達', '九州旗艦店', '高CP值海鮮'],
    notes: '博多站新幹線筑紫口出站步行 2 分鐘，九州特色限定鮮魚壽司。'
  },
  {
    code: 'sushiro-naha-amakuma',
    brand: '壽司郎',
    name: '壽司郎 那霸天久店',
    nameJa: 'スシロー 那覇天久店',
    region: '九州・沖繩',
    prefecture: '沖繩縣',
    address: '沖縄県那覇市天久1-1-1 樂市商場旁',
    lat: 26.2335,
    lng: 127.6945,
    phone: '098-860-8010',
    is24Hours: false,
    url: 'https://www.akindo-sushiro.co.jp/',
    tags: ['沖繩新都心', '超大免費停車場', '自駕必訪'],
    notes: '那霸新都心天久商場，附設大型停車場，外國旅客自駕首選。'
  },
  {
    code: 'sushiro-sapporo-susukino',
    brand: '壽司郎',
    name: '壽司郎 札幌Susukino店',
    nameJa: 'スシロー すすきの店',
    region: '北海道・東北',
    prefecture: '北海道',
    address: '北海道札幌市中央区南4条西3丁目1-1 COCONO SUSUKINO 4F',
    lat: 43.0558,
    lng: 141.3535,
    phone: '011-200-8110',
    is24Hours: false,
    url: 'https://www.akindo-sushiro.co.jp/',
    tags: ['札幌薄野地標商場', '北海道限定鮮魚', '地鐵薄野站直結'],
    notes: '札幌最新地標 COCONO SUSUKINO 4 樓，享用北海道當季新鮮水產。'
  }
];

// =========================================================================
// 5. 迴轉壽司雙雄：藏壽司 (Kura Sushi / くら寿司)
// =========================================================================
export const KURA_SUSHI_SEED = [
  {
    code: 'kura-asakusa-global',
    brand: '藏壽司',
    name: '藏壽司 淺草ROX全球旗艦店',
    nameJa: 'くら寿司 浅草ROX店 グローバル旗艦店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区浅草1-25-15 浅草ROX 4F',
    lat: 35.7138,
    lng: 139.7928,
    phone: '03-5830-6106',
    is24Hours: false,
    url: 'https://www.kurasushi.co.jp/',
    tags: ['全球旗艦店', '祭典射擊射的遊戲', '江戶風浮世繪', '盤子扭蛋 (Bikkura-Pon)'],
    notes: '世界首間全球旗艦店！結合日本江戶祭典射擊、射的、燈籠牆與扭蛋，外國旅客朝聖第一名。'
  },
  {
    code: 'kura-harajuku-global',
    brand: '藏壽司',
    name: '藏壽司 原宿全球旗艦店',
    nameJa: 'くら寿司 原宿店 グローバル旗艦店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区神宮前4-31-10 ワイ・エム・スクウェア原宿 4F',
    lat: 35.6692,
    lng: 139.7058,
    phone: '03-6804-6105',
    is24Hours: false,
    url: 'https://www.kurasushi.co.jp/',
    tags: ['全球旗艦店', '原宿甜點可麗餅可麗露專區', '潮流打卡勝地'],
    notes: '原宿潮流商圈核心，店內特設「壽司可麗餅」現做專區與拍照打卡露台。'
  },
  {
    code: 'kura-skytree-global',
    brand: '藏壽司',
    name: '藏壽司 押上晴空塔站前全球旗艦店',
    nameJa: 'くら寿司 スカイツリー押上駅前店 グローバル旗艦店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都墨田区押上1-8-23',
    lat: 35.7108,
    lng: 139.8135,
    phone: '03-6658-8106',
    is24Hours: false,
    url: 'https://www.kurasushi.co.jp/',
    tags: ['全球旗艦店', '世界最大藏壽司', '晴空塔正前方', '數位巨大扭蛋螢幕'],
    notes: '全日本面積最大藏壽司！樓高兩層，巨大數位互動牆與晴空塔絕美景色。'
  },
  {
    code: 'kura-ginza-global',
    brand: '藏壽司',
    name: '藏壽司 銀座全球旗艦店',
    nameJa: 'くら寿司 銀座店 グローバル旗艦店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都中央区銀座3-2-1 マロニエゲート銀座2 7F',
    lat: 35.6732,
    lng: 139.7652,
    phone: '03-6228-7610',
    is24Hours: false,
    url: 'https://www.kurasushi.co.jp/',
    tags: ['全球旗艦店', '銀座MarronnierGate', '高級檜木吧檯', '攤位現做屋台壽司'],
    notes: '銀座 Marronnier Gate 2 7 樓，打造江戶屋台「藏小路」主題區，現烤現捏。'
  },
  {
    code: 'kura-shibuya-ekimae',
    brand: '藏壽司',
    name: '藏壽司 澀谷站前店',
    nameJa: 'くら寿司 渋谷駅前店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区宇田川町20-15 ヒューマックスパビリオン渋谷公園通り B1F',
    lat: 35.6612,
    lng: 139.7008,
    phone: '03-6455-1510',
    is24Hours: false,
    url: 'https://www.kurasushi.co.jp/',
    tags: ['澀谷公園通', '智慧無接觸點餐', '盤子扭蛋'],
    notes: '澀谷公園通 HUMAX 建築地下 1 樓，全自動智慧引導與無接觸送餐。'
  },
  {
    code: 'kura-ikebukuro-higashi',
    brand: '藏壽司',
    name: '藏壽司 池袋東口店',
    nameJa: 'くら寿司 池袋サンシャイン60通り店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都豊島区東池袋1-29-1 サントロペ池袋 6F',
    lat: 35.7308,
    lng: 139.7158,
    phone: '03-5962-0610',
    is24Hours: false,
    url: 'https://www.kurasushi.co.jp/',
    tags: ['池袋太陽城60通', '無接觸點餐', '人氣扭蛋'],
    notes: '池袋太陽城 60 通 Saint-Tropez 6 樓，扭蛋活動深受動漫迷喜愛。'
  },
  {
    code: 'kura-osaka-namba-global',
    brand: '藏壽司',
    name: '藏壽司 難波全球旗艦店',
    nameJa: 'くら寿司 なんばパークスサウス店 グローバル旗艦店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市浪速区難波中2-11-18 なんばパークスサウス 2F',
    lat: 34.6615,
    lng: 135.5018,
    phone: '06-6630-6106',
    is24Hours: false,
    url: 'https://www.kurasushi.co.jp/',
    tags: ['全球旗艦店', '難波ParksSouth', '關西第一座旗艦店', '江戶祭典風情'],
    notes: '關西首座全球旗艦店！難波 Parks South 2 樓，屋台攤位現做壽司。'
  },
  {
    code: 'kura-osaka-shinsekai',
    brand: '藏壽司',
    name: '藏壽司 新世界通天閣店',
    nameJa: 'くら寿司 新世界通天閣店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市浪速区恵美須東2-1-22',
    lat: 34.6528,
    lng: 135.5065,
    phone: '06-6632-6105',
    is24Hours: false,
    url: 'https://www.kurasushi.co.jp/',
    tags: ['新世界通天閣旁', '大阪在地觀光', '炸串壽司'],
    notes: '通天閣正下方，大阪下町復古風情與平價壽司巡禮。'
  },
  {
    code: 'kura-kyoto-ekimae',
    brand: '藏壽司',
    name: '藏壽司 京都站八條口店',
    nameJa: 'くら寿司 京都駅八条口店',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市南区西九条北ノ内町13 イオンモールKYOTO 4F',
    lat: 34.9825,
    lng: 135.7558,
    phone: '075-693-6105',
    is24Hours: false,
    url: 'https://www.kurasushi.co.jp/',
    tags: ['永旺夢樂城KYOTO', '京都站新幹線旁', '寬敞家庭座'],
    notes: 'AEON Mall KYOTO 4 樓，京都站八條口步行 5 分鐘，免排隊大空間。'
  },
  {
    code: 'kura-fukuoka-tenjin',
    brand: '藏壽司',
    name: '藏壽司 福岡天神店',
    nameJa: 'くら寿司 天神店',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市中央区天神1-4-1 エルガーラ 6F',
    lat: 33.5888,
    lng: 130.4015,
    phone: '092-738-6105',
    is24Hours: false,
    url: 'https://www.kurasushi.co.jp/',
    tags: ['福岡大丸百貨旁', '天神南站直結', '九州核心商圈'],
    notes: '西鐵天神與地鐵天神南站直通 ELGALA 6 樓，大丸百貨旁。'
  },
  {
    code: 'kura-okinawa-rycom',
    brand: '藏壽司',
    name: '藏壽司 沖繩永旺來客夢店',
    nameJa: 'くら寿司 イオンモール沖縄ライカム店',
    region: '九州・沖繩',
    prefecture: '沖繩縣',
    address: '沖縄県中頭郡北中城村ライカム1番地 イオンモール沖縄ライカム 4F',
    lat: 26.3148,
    lng: 127.7955,
    phone: '098-931-6105',
    is24Hours: false,
    url: 'https://www.kurasushi.co.jp/',
    tags: ['沖繩最大商場', '永旺來客夢', '自駕必吃壽司'],
    notes: '沖繩最大購物中心 AEON Mall Rycom 4 樓，停車方便，旅客熱門點。'
  }
];

// =========================================================================
// 6. 日式定食連鎖：やよい軒 (彌生軒 / Yayoi-ken)
// =========================================================================
export const YAYOI_KEN_SEED = [
  {
    code: 'yayoi-shinjuku-meiji',
    brand: 'やよい軒',
    name: '彌生軒 新宿明治通店',
    nameJa: 'やよい軒 新宿明治通り店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区新宿5-17-9',
    lat: 35.6935,
    lng: 139.7058,
    phone: '03-5292-1210',
    is24Hours: true,
    url: 'https://www.yayoiken.com/',
    tags: ['白飯免費續加', '日式定食', '生薑燒肉定食', '花園神社旁'],
    notes: '花園神社與新宿伊勢丹旁，經典日式白飯無限免費續加，香脆炸豬排與烤鯖魚定食。'
  },
  {
    code: 'yayoi-shibuya-kaminokawachi',
    brand: 'やよい軒',
    name: '彌生軒 澀谷道玄坂店',
    nameJa: 'やよい軒 渋谷道玄坂店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区道玄坂2-29-8',
    lat: 35.6595,
    lng: 139.6978,
    phone: '03-5459-8110',
    is24Hours: true,
    url: 'https://www.yayoiken.com/',
    tags: ['24小時營業', 'SHIBUYA 109旁', '日式朝食套餐'],
    notes: '澀谷道玄坂鬧區 24 小時營業，早晨供應經典納豆生雞蛋烤魚朝食。'
  },
  {
    code: 'yayoi-ikebukuro-higashi',
    brand: 'やよい軒',
    name: '彌生軒 東池袋店',
    nameJa: 'やよい軒 東池袋店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都豊島区東池袋1-30-6',
    lat: 35.7315,
    lng: 139.7155,
    phone: '03-5953-8110',
    is24Hours: false,
    url: 'https://www.yayoiken.com/',
    tags: ['池袋太陽城旁', '日式南蠻雞定食', '白飯續加機器'],
    notes: '池袋太陽城商圈，採用自動注飯機盛裝熱騰騰白米飯，乾淨衛生。'
  },
  {
    code: 'yayoi-ueno-inatsuke',
    brand: 'やよい軒',
    name: '彌生軒 上野東口店',
    nameJa: 'やよい軒 上野東口店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区東上野3-37-9',
    lat: 35.7125,
    lng: 139.7785,
    phone: '03-5807-1210',
    is24Hours: false,
    url: 'https://www.yayoiken.com/',
    tags: ['上野站東口', '烤花毛魚定食', '高CP值'],
    notes: 'JR 上野站淺草口與東口旁，日本正宗家庭風味定食。'
  },
  {
    code: 'yayoi-osaka-namba',
    brand: 'やよい軒',
    name: '彌生軒 難波元町店',
    nameJa: 'やよい軒 難波元町店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市浪速区元町1-11-8',
    lat: 34.6642,
    lng: 135.4985,
    phone: '06-6630-1210',
    is24Hours: true,
    url: 'https://www.yayoiken.com/',
    tags: ['24小時營業', '難波八阪神社旁', '白飯吃到飽'],
    notes: '難波八阪神社（獅子殿）散策必經，24 小時無休，餐點豐盛多樣。'
  },
  {
    code: 'yayoi-kyoto-shijo',
    brand: 'やよい軒',
    name: '彌生軒 京都四條烏丸店',
    nameJa: 'やよい軒 四条烏丸店',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市下京区四条通西洞院東入新釜座町716',
    lat: 35.0038,
    lng: 135.7562,
    phone: '075-254-1210',
    is24Hours: false,
    url: 'https://www.yayoiken.com/',
    tags: ['京都四條通', '錦市場散策', '日式定食名店'],
    notes: '四條通商圈，錦市場與四條烏丸車站步行 5 分鐘，體驗道地日式日常定食。'
  },
  {
    code: 'yayoi-hakata-gion',
    brand: 'やよい軒',
    name: '彌生軒 博多祇園店',
    nameJa: 'やよい軒 祇園店',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市博多区祇園町1-18',
    lat: 33.5925,
    lng: 130.4145,
    phone: '092-283-1210',
    is24Hours: true,
    url: 'https://www.yayoiken.com/',
    tags: ['24小時營業', '櫛田神社旁', '博多運河城周邊'],
    notes: '地下鐵祇園站直通，櫛田神社與博多運河城步行 3 分鐘。'
  }
];

// =========================================================================
// 7. 日式定食連鎖：大戶屋 (Ootoya)
// =========================================================================
export const OOTOYA_SEED = [
  {
    code: 'ootoya-shinjuku-higashi',
    brand: '大戶屋',
    name: '大戶屋 新宿東口中央通店',
    nameJa: '大戸屋 新宿東口中央通り店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区新宿3-34-11 ピースビル 2F',
    lat: 35.6908,
    lng: 139.7025,
    phone: '03-3354-1210',
    is24Hours: false,
    url: 'https://www.ootoya.com/',
    tags: ['現烤香酥魚', '日式家庭定食', '黑醋雞塊定食', '新宿車站步行2分'],
    notes: 'JR 新宿站東南口出站即達，經典特製黑醋炒雞塊野菜定食與香烤花魚。'
  },
  {
    code: 'ootoya-shibuya-park',
    brand: '大戶屋',
    name: '大戶屋 澀谷公園通店',
    nameJa: '大戸屋 渋谷公園通り店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区神南1-20-7 川原ビル 2F',
    lat: 35.6622,
    lng: 139.7008,
    phone: '03-3464-1210',
    is24Hours: false,
    url: 'https://www.ootoya.com/',
    tags: ['澀谷公園通', '健康五穀飯', '代代木公園散策'],
    notes: '澀谷公園通，代代木公園與澀谷站之間，提供營養均衡的五穀米日式家庭料理。'
  },
  {
    code: 'ootoya-ginza-namiki',
    brand: '大戶屋',
    name: '大戶屋 銀座並木通店',
    nameJa: '大戸屋 銀座並木通り店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都中央区銀座3-2-9 レントビル B1F',
    lat: 35.6728,
    lng: 139.7645,
    phone: '03-3563-1210',
    is24Hours: false,
    url: 'https://www.ootoya.com/',
    tags: ['銀座商圈', '有樂町站直通', '平價精緻日式定食'],
    notes: '銀座與有樂町交界處地下 1 樓，高質感且價格親民的日式正餐。'
  },
  {
    code: 'ootoya-ueno-ekimae',
    brand: '大戶屋',
    name: '大戶屋 上野丸井店',
    nameJa: '大戸屋 上野マルイ店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区上野6-15-1 上野マルイ 9F',
    lat: 35.7118,
    lng: 139.7755,
    phone: '03-5812-1210',
    is24Hours: false,
    url: 'https://www.ootoya.com/',
    tags: ['上野丸井百貨9F', 'JR上野站直結', '全景落地窗視野'],
    notes: '上野 0101 丸井百貨 9 樓美食街，JR 上野站天橋直結，高空用餐視野良好。'
  },
  {
    code: 'ootoya-osaka-namba-parks',
    brand: '大戶屋',
    name: '大戶屋 難波Parks店',
    nameJa: '大戸屋 なんばパークス店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市浪速区難波中2-10-70 なんばパークス 6F',
    lat: 34.6625,
    lng: 135.5018,
    phone: '06-6644-1210',
    is24Hours: false,
    url: 'https://www.ootoya.com/',
    tags: ['Namba Parks 6F', '南海難波站直通', '家庭定食'],
    notes: 'Namba Parks 6 樓花園餐廳街，搭南海電車前享用日式家常菜極為推薦。'
  },
  {
    code: 'ootoya-kyoto-porta',
    brand: '大戶屋',
    name: '大戶屋 京都Porta店',
    nameJa: '大戸屋 京都ポルタ店',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市下京区烏丸通塩小路下る東塩小路町902 京都駅前地下街ポルタ',
    lat: 34.9858,
    lng: 135.7588,
    phone: '075-353-1210',
    is24Hours: false,
    url: 'https://www.ootoya.com/',
    tags: ['京都站地下街Porta直通', '新幹線旁', '營養均衡定食'],
    notes: '京都站地下街 Porta 內，免出站直通新幹線與地鐵，蔬菜烤魚營養美味。'
  }
];

// =========================================================================
// 8. 咖啡喫茶：客美多咖啡 (Komeda's Coffee / コメダ珈琲店)
// =========================================================================
export const KOMEDA_SEED = [
  // 名古屋 (發祥聖地)
  {
    code: 'komeda-nagoya-honten',
    brand: '客美多咖啡',
    name: '客美多咖啡 名古屋名驛椿町店',
    nameJa: 'コメダ珈琲店 名古屋名駅椿町店',
    region: '中部',
    prefecture: '愛知縣',
    address: '愛知県名古屋市中村区椿町6-9',
    lat: 35.1702,
    lng: 136.8808,
    phone: '052-452-1210',
    is24Hours: false,
    url: 'https://www.komeda.co.jp/',
    tags: ['名古屋早餐朝食文化', '點飲品送吐司水煮蛋', '冰與火 (Shiro-Noir)', '太閤通口直達'],
    notes: 'JR 名古屋站新幹線太閤通口出站即達！點黑咖啡免費贈送厚片現烤吐司與紅豆泥水煮蛋。'
  },
  {
    code: 'komeda-nagoya-sakae',
    brand: '客美多咖啡',
    name: '客美多咖啡 榮錦店',
    nameJa: 'コメダ珈琲店 栄錦三丁目店',
    region: '中部',
    prefecture: '愛知縣',
    address: '愛知県名古屋市中区錦3-22-21',
    lat: 35.1712,
    lng: 136.9048,
    phone: '052-951-1210',
    is24Hours: false,
    url: 'https://www.komeda.co.jp/',
    tags: ['榮商圈核心', '熱門甜點冰與火', '名古屋招牌紅豆吐司'],
    notes: '名古屋市區最繁華的榮商圈錦三丁目，紅色絨布沙發與木質經典裝潢。'
  },
  // 東京首都圈
  {
    code: 'komeda-shinjuku-first',
    brand: '客美多咖啡',
    name: '客美多咖啡 新宿靖國通店',
    nameJa: 'コメダ珈琲店 新宿靖国通り店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区歌舞伎町1-5-2 クサマビル 2F',
    lat: 35.6938,
    lng: 139.7022,
    phone: '03-5292-1210',
    is24Hours: false,
    url: 'https://www.komeda.co.jp/',
    tags: ['新宿靖國通旁', '歌舞伎町入口', '免費早餐厚片吐司', '免費插座WiFi'],
    notes: '靖國通歌舞伎町入口旁 2 樓，逛街走累充電小憩第一首選，提供插座與 WiFi。'
  },
  {
    code: 'komeda-shibuya-miyashita',
    brand: '客美多咖啡',
    name: '客美多咖啡 澀谷宮下公園店',
    nameJa: 'コメダ珈琲店 渋谷宮下公園店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区神宮前6-20-10 MIYASHITA PARK 旁',
    lat: 35.6625,
    lng: 139.7028,
    phone: '03-6427-1210',
    is24Hours: false,
    url: 'https://www.komeda.co.jp/',
    tags: ['MIYASHITA PARK旁', '澀谷潮流商圈', '經典熱咖啡與厚吐司'],
    notes: '宮下公園潮流新地標旁，早上 7:00 開始營業，朝食超值熱門。'
  },
  {
    code: 'komeda-ikebukuro-higashi',
    brand: '客美多咖啡',
    name: '客美多咖啡 池袋西武前店',
    nameJa: 'コメダ珈琲店 池袋西武前店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都豊島区南池袋1-19-6 2F',
    lat: 35.7288,
    lng: 139.7128,
    phone: '03-5956-1210',
    is24Hours: false,
    url: 'https://www.komeda.co.jp/',
    tags: ['池袋東口西武前', '招牌冰與火', '安靜舒適包廂座'],
    notes: '池袋站東口步行 2 分鐘，經典舒適獨立隔間座位，適合放鬆閱讀。'
  },
  {
    code: 'komeda-asakusa-kaminarimon',
    brand: '客美多咖啡',
    name: '客美多咖啡 淺草橋店',
    nameJa: 'コメダ珈琲店 浅草橋駅前店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区浅草橋1-18-10',
    lat: 35.6978,
    lng: 139.7858,
    phone: '03-5829-1210',
    is24Hours: false,
    url: 'https://www.komeda.co.jp/',
    tags: ['JR淺草橋站出口', '晴空塔觀光前哨', '點咖啡贈早餐'],
    notes: 'JR 淺草橋站西口出站 1 分鐘，秋葉原與淺草寺之間便利站點。'
  },
  // 關西
  {
    code: 'komeda-osaka-shinsaibashi',
    brand: '客美多咖啡',
    name: '客美多咖啡 心齋橋店',
    nameJa: 'コメダ珈琲店 心斎橋店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区南船場3-5-15 2F',
    lat: 34.6748,
    lng: 135.5015,
    phone: '06-6241-1210',
    is24Hours: false,
    url: 'https://www.komeda.co.jp/',
    tags: ['心齋橋商店街旁', '南船場精品區', '早午餐首選'],
    notes: '心齋橋站出站步行 2 分鐘，寬敞無障礙空間，提供現烤吐司與漂浮咖啡。'
  },
  {
    code: 'komeda-osaka-namba',
    brand: '客美多咖啡',
    name: '客美多咖啡 難波千日前店',
    nameJa: 'コメダ珈琲店 なんば千日前店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区難波千日前8-23 2F',
    lat: 34.6655,
    lng: 135.5032,
    phone: '06-6634-1210',
    is24Hours: false,
    url: 'https://www.komeda.co.jp/',
    tags: ['千日前黑門市場旁', '南海難波站直通', '舒適沙發'],
    notes: '黑門市場與千日前道具街交界處，逛街休息、享受日式喫茶的最佳去處。'
  },
  {
    code: 'komeda-kyoto-shijo-karasuma',
    brand: '客美多咖啡',
    name: '客美多咖啡 京都四條烏丸店',
    nameJa: 'コメダ珈琲店 四条烏丸店',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市中京区烏丸通蛸薬師南入手洗水町646 2F',
    lat: 35.0055,
    lng: 135.7598,
    phone: '075-257-1210',
    is24Hours: false,
    url: 'https://www.komeda.co.jp/',
    tags: ['四條烏丸地鐵站旁', '大丸京都店後方', '晨間咖啡香'],
    notes: '京都四條烏丸商圈，大丸京都店後方 2 樓，早晨 7:00 開放享用超人氣早餐。'
  },
  // 九州・沖繩
  {
    code: 'komeda-hakata-chikushi',
    brand: '客美多咖啡',
    name: '客美多咖啡 博多站筑紫口店',
    nameJa: 'コメダ珈琲店 博多駅筑紫口店',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市博多区博多駅中央街4-23',
    lat: 33.5895,
    lng: 130.4222,
    phone: '092-432-1210',
    is24Hours: false,
    url: 'https://www.komeda.co.jp/',
    tags: ['博多新幹線筑紫口直達', '九州旅情晨光', '招牌厚吐司'],
    notes: 'JR 博多站筑紫口步行 1 分鐘，搭新幹線前悠閒享用早餐與咖啡。'
  },
  {
    code: 'komeda-okinawa-naha-higawa',
    brand: '客美多咖啡',
    name: '客美多咖啡 沖繩那霸樋川店',
    nameJa: 'コメダ珈琲店 沖縄樋川店',
    region: '九州・沖繩',
    prefecture: '沖繩縣',
    address: '沖縄県那覇市樋川2-3-1',
    lat: 26.2098,
    lng: 127.6892,
    phone: '098-833-1210',
    is24Hours: false,
    url: 'https://www.komeda.co.jp/',
    tags: ['沖繩第一家客美多', '免費停車位', '國際通周邊自駕'],
    notes: '沖繩首家客美多咖啡！設有大型專用停車場，深受自駕家庭旅客喜愛。'
  }
];

export const DINING_STORES_SEED = [
  ...YOSHINOYA_SEED.slice(0, 3),
  ...MATSUYA_SEED.slice(0, 2),
  ...SUKIYA_SEED.slice(0, 2),
  ...KOMEDA_SEED.slice(0, 2),
  {
    code: 'ichiran-shinjuku-test',
    brand: '一蘭拉麵',
    name: '一蘭拉麵 新宿中央東口店',
    nameJa: '一蘭 新宿中央東口店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区新宿3-34-11 ピースビル B1F',
    lat: 35.6905,
    lng: 139.7028,
    phone: '03-3225-5518',
    is24Hours: true,
    url: 'https://ichiran.com/shop/tokyo/shinjuku/',
    tags: ['24小時營業', '天然豚骨拉麵', '味集中座位'],
    notes: 'JR 新宿站東南口步行 2 分鐘，24 小時營業。'
  }
];

/**
 * 距離車站半徑過濾演算法 (預設 500 公尺)
 */
export function filterStoresWithinStationRadius(stores, stationsList = [], maxRadiusMeters = 500) {
  if (!Array.isArray(stores)) return [];
  if (!Array.isArray(stationsList) || stationsList.length === 0) return stores;

  const filtered = [];
  for (const s of stores) {
    const lat = Number(s.lat);
    const lng = Number(s.lng);
    const match = findNearestStation(lat, lng, stationsList, maxRadiusMeters);
    if (match.station && match.distanceMeters <= maxRadiusMeters) {
      filtered.push({
        ...s,
        nearestStation: match.station.name,
        stationLine: match.station.lines?.[0] || 'JR / 地鐵',
        stationDistanceMeters: match.distanceMeters,
        walkMinutes: match.walkMinutes,
        stationAccess: match.note
      });
    }
  }
  return filtered;
}

/**
 * 組合所有餐飲資料集（含一蘭全國 86 間、一風堂全國 156 間、三大牛丼、迴轉壽司雙雄、定食與客美多咖啡）
 * @param {Array<object>} [rawList]
 * @param {Array<object>} [stationsList=[]]
 * @param {number} [maxRadiusMeters=10000]
 * @returns {Array<object>}
 */
export function buildDiningSpots(rawList, stationsList = [], maxRadiusMeters = 10000) {
  let isCustomList = false;
  let targetSeeds = [];

  if (Array.isArray(rawList) && rawList.length > 0 && (rawList[0].brand || rawList[0].name || rawList[0].address)) {
    isCustomList = true;
    targetSeeds = rawList;
  } else {
    if (Array.isArray(rawList) && rawList.length > 0 && (rawList[0].name && rawList[0].lat && !rawList[0].brand)) {
      stationsList = rawList;
    }
    // 1. 載入已自動爬取的一蘭 (86) 與一風堂 (156) 全國門市
    let ichiranSpots = [];
    const ichiranPath = path.resolve('src/data/ichiran_full_seed.json');
    if (fs.existsSync(ichiranPath)) {
      try {
        ichiranSpots = JSON.parse(fs.readFileSync(ichiranPath, 'utf8'));
      } catch (e) {
        console.warn('讀取 ichiran_full_seed.json 失敗:', e.message);
      }
    }

    let ippudoSpots = [];
    const ippudoPath = path.resolve('src/data/ippudo_full_seed.json');
    if (fs.existsSync(ippudoPath)) {
      try {
        ippudoSpots = JSON.parse(fs.readFileSync(ippudoPath, 'utf8'));
      } catch (e) {
        console.warn('讀取 ippudo_full_seed.json 失敗:', e.message);
      }
    }

    targetSeeds = [
      ...ichiranSpots,
      ...ippudoSpots,
      ...YOSHINOYA_SEED,
      ...MATSUYA_SEED,
      ...SUKIYA_SEED,
      ...SUSHIRO_SEED,
      ...KURA_SUSHI_SEED,
      ...YAYOI_KEN_SEED,
      ...OOTOYA_SEED,
      ...KOMEDA_SEED
    ];
  }

  const processed = targetSeeds.map(s => {
    const lat = Number(s.lat);
    const lng = Number(s.lng);

    let nearestStation = s.nearestStation || (s.name.includes('店') ? s.name.replace(/店$/, '') : `${s.prefecture || '各地'}主要車站`);
    let stationLine = s.stationLine || 'JR / 地鐵 / 私鐵';
    let walkMin = s.walkMinutes || 3;

    if (!s.nearestStation && stationsList.length > 0 && lat && lng) {
      const match = findNearestStation(lat, lng, stationsList, maxRadiusMeters);
      if (match.station) {
        nearestStation = match.station.name;
        walkMin = match.walkMinutes || 3;
        stationLine = match.station.lines?.[0] || 'JR / 地鐵';
      }
    }

    let tags = [];
    if (Array.isArray(s.tags)) tags = [...s.tags];
    else if (typeof s.tags === 'string') tags = s.tags.split(',').map(t => t.trim()).filter(Boolean);

    if (s.is24Hours && !tags.includes('24小時營業')) tags.unshift('24小時營業');
    if (s.brand === '客美多咖啡' && !tags.includes('買飲料送早餐')) tags.push('買飲料送早餐');
    if (walkMin <= 3 && !tags.includes('車站步行3分內')) tags.push('車站步行3分內');

    let imageUrl = s.imageUrl || 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80';
    if (s.brand === '壽司郎' || s.brand === '藏壽司') {
      imageUrl = 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80';
    } else if (s.brand === '吉野家' || s.brand === '松屋' || s.brand === 'すき家') {
      imageUrl = 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80';
    } else if (s.brand === '客美多咖啡') {
      imageUrl = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80';
    } else if (s.brand === 'やよい軒' || s.brand === '大戶屋') {
      imageUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
    }

    const rawId = s.id || (s.code ? `dining-${s.code}` : `dining-${Math.random().toString(36).slice(2, 8)}`);
    const id = rawId.startsWith('dining-') ? rawId : `dining-${rawId}`;

    return {
      id,
      category: '美食餐廳',
      brand: s.brand,
      name: s.name,
      nameJa: s.nameJa || s.name,
      region: s.region || '其他',
      prefecture: s.prefecture || '其他',
      nearestStation,
      stationLine,
      stationAccess: s.stationAccess || `鄰近 ${nearestStation} 步行約 ${walkMin} 分鐘`,
      walkMinutes: walkMin,
      address: s.address,
      coordinates: `${lat}, ${lng}`,
      lat,
      lng,
      phone: s.phone || '',
      bookingUrl: s.bookingUrl || s.url || 'https://www.google.com/',
      googleMapUrl: `https://maps.google.com/?q=${lat},${lng}`,
      imageUrl,
      images: [imageUrl],
      tags: tags.join(', '),
      notes: s.notes || `${s.brand} 日本知名人氣連鎖餐廳，平價美味。`
    };
  });

  const { uniqueSpots, duplicateCount } = deduplicateSpots(processed);
  const validation = validateSpotsBatch(uniqueSpots);

  if (!isCustomList) {
    console.log(`[Dining Module] 建置完成: 共 ${uniqueSpots.length} 間，重複: ${duplicateCount} 筆，驗證通過: ${validation.validCount} 間`);
  }

  return uniqueSpots;
}

export function saveDiningSeed(stationsList = [], outDir = 'src/data') {
  const spots = buildDiningSpots(null, stationsList);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const targetPath = path.join(outDir, 'dining_seed.json');
  fs.writeFileSync(targetPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`💾 [Dining] 成功儲存 ${spots.length} 筆美食餐廳門市至 ${targetPath}`);
  return spots;
}

async function run() {
  const stationsPath = path.resolve('src/data/stations.json');
  const stations = fs.existsSync(stationsPath) ? JSON.parse(fs.readFileSync(stationsPath, 'utf8')) : [];
  saveDiningSeed(stations);
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith('dining.js')) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

