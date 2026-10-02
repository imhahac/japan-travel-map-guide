/**
 * =========================================================================
 * APA 飯店爬蟲與資料模組 (APA Hotel Scraper & Seed Module)
 * =========================================================================
 * 提供全日本主要連鎖商務飯店 APA Hotel 門市資料、座標、大浴場標籤與最近車站配對。
 */

import fs from 'fs';
import path from 'path';
import { findNearestStation } from '../core/geo.js';
import { validateSpotsBatch } from '../core/validator.js';
import { deduplicateSpots } from '../core/dedupe.js';

// 日本全國高熱門 APA 飯店種子列表（涵蓋東京、大阪、京都、名古屋、福岡、札幌、廣島、金澤等核心樞紐）
export const APA_HOTELS_SEED = [
  // --- 東京首都圈 ---
  {
    code: 'shinjuku-kabukicho-tower',
    name: 'APA飯店〈新宿 歌舞伎町塔〉',
    nameJa: 'アパホテル〈新宿 歌舞伎町タワー〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区歌舞伎町1-20-2',
    lat: 35.6953,
    lng: 139.7018,
    phone: '03-5155-3811',
    urlKey: 'syutoken/tokyo/shinjuku-kabukichotower',
    tags: ['頂樓大浴場', '露天風呂', '車站步行5分內'],
    notes: '28層超高層地標塔樓，頂樓設有人工溫泉展望大浴場與露天風呂。'
  },
  {
    code: 'shinjuku-gyoenmae',
    name: 'APA飯店〈新宿御苑前〉',
    nameJa: 'アパホテル〈新宿御苑前〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区新宿2-2-8',
    lat: 35.6888,
    lng: 139.7095,
    phone: '03-5379-5111',
    urlKey: 'syutoken/tokyo/shinjuku-gyoenmae',
    tags: ['大浴場', '車站步行1分內', '新宿商圈'],
    notes: '地下鐵新宿御苑前站 1 號出口步行 1 分鐘，附設大浴場「玄要之湯」。'
  },
  {
    code: 'tokyo-eki-yaesu',
    name: 'APA飯店〈東京站前 八重洲通〉',
    nameJa: 'アパホテル〈八重洲通〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都中央区八丁堀1-4-5',
    lat: 35.6795,
    lng: 139.7758,
    phone: '03-5541-2111',
    urlKey: 'syutoken/tokyo/tokyo-eki-yaesu',
    tags: ['車站步行5分內', '新幹線樞紐'],
    notes: '鄰近東京站八重洲口與八丁堀站，直通成田特急與新幹線。'
  },
  {
    code: 'roppongi-ekimae',
    name: 'APA飯店〈六本木站前〉',
    nameJa: 'アパホテル〈六本木駅前〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都港区六本木6-7-8',
    lat: 35.6625,
    lng: 139.7314,
    phone: '03-5413-6811',
    urlKey: 'syutoken/tokyo/roppongi-ekimae',
    tags: ['車站步行1分內', '六本木之丘'],
    notes: '日比谷線/大江戶線六本木站 3 號出口步行 1 分鐘，直達六本木之丘。'
  },
  {
    code: 'ueno-ekimae',
    name: 'APA飯店〈上野站前〉',
    nameJa: 'アパホテル〈上野駅前〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区東上野2-18-7',
    lat: 35.7118,
    lng: 139.7785,
    phone: '03-5807-6111',
    urlKey: 'syutoken/tokyo/ueno-ekimae',
    tags: ['頂樓大浴場', '露天風呂', '京成Skyliner直通'],
    notes: '京成上野站直達 Skyliner 直通成田機場 36 分鐘，頂樓附露天大浴場。'
  },
  {
    code: 'asakusa-ekimae',
    name: 'APA飯店〈淺草站前〉',
    nameJa: 'アパホテル〈浅草駅前〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区駒形1-12-16',
    lat: 35.7087,
    lng: 139.7963,
    phone: '03-5830-0111',
    urlKey: 'syutoken/tokyo/asakusa-ekimae',
    tags: ['雷門商圈', '晴空塔景觀', '車站步行1分內'],
    notes: '淺草線淺草站 A1 出口步行 1 分鐘，步行至雷門僅需 3 分鐘。'
  },
  {
    code: 'shibuya-dogenzaka',
    name: 'APA飯店〈澀谷道玄坂上〉',
    nameJa: 'アパホテル〈渋谷道玄坂上〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区円山町20-1',
    lat: 35.6568,
    lng: 139.6938,
    phone: '03-6416-7111',
    urlKey: 'syutoken/tokyo/shibuya-dogenzakaueno',
    tags: ['澀谷商圈', '年輕人潮流聚落'],
    notes: 'JR 澀谷站八公口步行約 8 分鐘，道玄坂流行夜生活樞紐。'
  },
  {
    code: 'ikebukuro-ekikitaguchi',
    name: 'APA飯店〈池袋站北口〉',
    nameJa: 'アパホテル〈池袋駅北口〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都豊島区池袋2-48-7',
    lat: 35.7335,
    lng: 139.7112,
    phone: '03-5911-8111',
    urlKey: 'syutoken/tokyo/ikebukuro-ekikitaguchi',
    tags: ['池袋商圈', '車站步行4分內'],
    notes: 'JR 池袋站西口（北）步行約 4 分鐘，陽光城與周邊美食林立。'
  },
  {
    code: 'akihabara-eki-denkigaiguchi',
    name: 'APA飯店〈秋葉原站電氣街口〉',
    nameJa: 'アパホテル〈秋葉原駅電気街口〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都千代田区外神田3-11-4',
    lat: 35.7008,
    lng: 139.7712,
    phone: '03-5297-6111',
    urlKey: 'syutoken/tokyo/akihabara-eki-denkigaiguchi',
    tags: ['秋葉原電器街', '動漫聖地', '車站步行3分內'],
    notes: '秋葉原電氣街正中央，逛電器動漫回飯店僅需 3 分鐘。'
  },
  {
    code: 'yokohama-bay-tower',
    name: 'APA飯店渡假村〈橫濱港未來灣塔〉',
    nameJa: 'アパホテル＆リゾート〈横浜ベイタワー〉',
    region: '關東',
    prefecture: '神奈川縣',
    address: '神奈川県横浜市中区海岸通5-25-3',
    lat: 35.4526,
    lng: 139.6385,
    phone: '045-226-5111',
    urlKey: 'syutoken/kanagawa/yokohama-bay-tower',
    tags: ['超大型度假飯店', '海景大浴場', '港未來21'],
    notes: '高達 2,311 間客房之日本最大量級度假商旅，擁有港灣夜景與露天大浴場。'
  },

  // --- 近畿關西圈 (大阪 / 京都 / 神戶) ---
  {
    code: 'osaka-namba-ekimae',
    name: 'APA飯店〈難波心齋橋〉',
    nameJa: 'アパホテル〈なんば心斎橋〉',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区西心斎橋2-7-12',
    lat: 34.6698,
    lng: 135.4988,
    phone: '06-6214-0111',
    urlKey: 'kansai/osaka/namba-shinsaibashi',
    tags: ['道頓堀商圈', '心齋橋步行1分', '車站步行4分內'],
    notes: '走出飯店即是心齋橋筋與道頓堀跑跑人地標，美食購物全日本最熱門。'
  },
  {
    code: 'osaka-umeda-eki-tower',
    name: 'APA飯店渡假村〈大阪梅田站塔〉',
    nameJa: 'アパホテル＆リゾート〈大阪梅田駅タワー〉',
    region: '關西',
    prefecture: '大阪府',
    address: '大阪府大阪市北区曾根崎2-8-32',
    lat: 34.7005,
    lng: 135.5012,
    phone: '06-6131-0511',
    urlKey: 'kansai/osaka/osaka-umeda-eki-tower',
    tags: ['展望頂樓泳池', '天然溫泉大浴場', '梅田商圈'],
    notes: '34層超高層塔樓，設有頂樓露天溫泉與梅田全景觀景台。'
  },
  {
    code: 'shin-osaka-ekimae',
    name: 'APA飯店〈新大阪站前〉',
    nameJa: 'アパホテル〈新大阪駅前〉',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市東淀川区東中島1-21-27',
    lat: 34.7335,
    lng: 135.5028,
    phone: '06-6321-4111',
    urlKey: 'kansai/osaka/shin-osaka-ekimae',
    tags: ['新幹線樞紐', '大浴場', '車站步行2分內'],
    notes: 'JR 新大阪站東口步行 2 分鐘，轉乘山陽/東海道新幹線極度便捷。'
  },
  {
    code: 'kyoto-ekimae',
    name: 'APA飯店〈京都站前〉',
    nameJa: 'アパホテル〈京都駅前〉',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市下京区西洞院通塩小路下ル南不動堂町806',
    lat: 34.9862,
    lng: 135.7554,
    phone: '075-365-4111',
    urlKey: 'kansai/kyoto/kyoto-ekimae',
    tags: ['京都站步行3分', '新幹線轉乘', '京都塔周邊'],
    notes: 'JR 京都站烏丸中央口步行 3 分鐘，古都自由行最經典大站據點。'
  },
  {
    code: 'kyoto-gion-kenninji',
    name: 'APA飯店〈京都祇園 EXCELLENT〉',
    nameJa: 'アパホテル〈京都祇園〉EXCELLENT',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市東山区祇園町南側555',
    lat: 35.0035,
    lng: 135.7762,
    phone: '075-551-2111',
    urlKey: 'kansai/kyoto/kyoto-gion',
    tags: ['八坂神社', '祇園花見小路', '頂樓花園'],
    notes: '座落於八坂神社正門口前，步行 2 分鐘即達花見小路。'
  },
  {
    code: 'kobe-sannomiya-ekimae',
    name: 'APA飯店〈神戶三宮站前〉',
    nameJa: 'アパホテル〈神戸三宮駅前〉',
    region: '近畿',
    prefecture: '兵庫縣',
    address: '兵庫県神戸市中央区下山手通2-11-26',
    lat: 34.6932,
    lng: 135.1905,
    phone: '078-335-0811',
    urlKey: 'kansai/hyogo/kobe-sannomiya-ekimae',
    tags: ['神戶三宮商圈', '生田神社旁', '車站步行4分內'],
    notes: '阪急/神戶地鐵三宮站步行 4 分鐘，鄰近生田神社與異人館商圈。'
  },

  // --- 中部東海 (名古屋 / 金澤) ---
  {
    code: 'nagoya-ekimae-shinkansenguchi',
    name: 'APA飯店〈名古屋站新幹線口〉',
    nameJa: 'アパホテル〈名古屋駅新幹線口〉',
    region: '東海・甲信越・北陸',
    prefecture: '愛知縣',
    address: '愛知県名古屋市中村区椿町1-23',
    lat: 35.1702,
    lng: 136.8798,
    phone: '052-459-3111',
    urlKey: 'tokai/aichi/nagoya-eki-shinkansenguchi',
    tags: ['新幹線出口', '大浴場', '車站步行3分內'],
    notes: 'JR 名古屋站太閤通口（新幹線口）步行 3 分鐘，附設大浴場「玄要之湯」。'
  },
  {
    code: 'kanazawa-ekimae',
    name: 'APA飯店〈金澤站前〉',
    nameJa: 'アパホテル〈金沢駅前〉',
    region: '東海・甲信越・北陸',
    prefecture: '石川縣',
    address: '石川県金沢市広岡1-9-28',
    lat: 36.5798,
    lng: 136.6472,
    phone: '076-231-8111',
    urlKey: 'hokuriku/ishikawa/kanazawa-ekimae',
    tags: ['金澤兼六園門戶', '天然溫泉露天浴場', '車站步行1分內'],
    notes: '北陸新幹線金澤站西口徒步 1 分鐘，設有全金澤最完備的露天大浴場與桑拿。'
  },

  // --- 九州 (福岡 / 熊本 / 鹿兒島) ---
  {
    code: 'hakata-ekimae-3chome',
    name: 'APA飯店〈博多站前3丁目〉',
    nameJa: 'アパホテル〈博多駅前3丁目〉',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市博多区博多駅前3-11-6',
    lat: 33.5872,
    lng: 130.4175,
    phone: '092-432-8111',
    urlKey: 'kyushu/fukuoka/hakata-ekimae-3chome',
    tags: ['大浴場', '博多拉麵街', '車站步行5分內'],
    notes: 'JR 博多站博多口步行 5 分鐘，轉乘福岡地鐵至福岡機場僅需 5 分鐘。'
  },
  {
    code: 'fukuoka-tenjin-nishi',
    name: 'APA飯店〈福岡天神西〉',
    nameJa: 'アパホテル〈福岡天神西〉',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市中央区大名1-9-38',
    lat: 33.5878,
    lng: 130.3925,
    phone: '092-737-8111',
    urlKey: 'kyushu/fukuoka/fukuoka-tenjin-nishi',
    tags: ['天神購物商圈', '屋台美食街', '車站步行3分內'],
    notes: '地鐵赤坂站步行 3 分鐘，緊鄰天神大名潮流服飾與屋台聚集地。'
  },
  {
    code: 'kumamoto-sakuramachi',
    name: 'APA飯店〈熊本櫻町〉',
    nameJa: 'アパホテル〈熊本桜町バスターミナル南〉',
    region: '九州・沖繩',
    prefecture: '熊本縣',
    address: '熊本県熊本市中央区船場町下1-6-1',
    lat: 32.7985,
    lng: 130.7028,
    phone: '096-324-8111',
    urlKey: 'kyushu/kumamoto/kumamoto-sakuramachi',
    tags: ['熊本城商圈', '櫻町巴士總站旁'],
    notes: '緊鄰櫻町熊本大型商場與巴士總站，直達熊本城與阿蘇觀光。'
  },

  // --- 北海道 (札幌) ---
  {
    code: 'sapporo-susukino-ekimae',
    name: 'APA飯店〈札幌薄野站前〉',
    nameJa: 'アパホテル〈札幌すすきの駅前〉',
    region: '北海道',
    prefecture: '北海道',
    address: '北海道札幌市中央区南4条西2丁目2-5',
    lat: 43.0558,
    lng: 141.3562,
    phone: '011-511-9111',
    urlKey: 'hokkaido/sapporo/susukino-ekimae',
    tags: ['薄野商圈', '地下鐵直通', '狸小路商店街'],
    notes: '地下鐵東豐線豐水薄野站直通，步行 2 分鐘至狸小路商店街與拉麵橫丁。'
  },
  {
    code: 'sapporo-odori-eki-nishi',
    name: 'APA飯店〈札幌大通站前〉',
    nameJa: 'アパホテル〈札幌大通駅前〉',
    region: '北海道',
    prefecture: '北海道',
    address: '北海道札幌市中央区南2条西7丁目10-1',
    lat: 43.0585,
    lng: 141.3468,
    phone: '011-281-8111',
    urlKey: 'hokkaido/sapporo/odori-eki-nishi',
    tags: ['大通公園', '札幌雪祭會場', '大浴場'],
    notes: '鄰近大通公園，冬季札幌雪祭散步即達，附設室內大浴場。'
  },

  // --- 中國 (廣島) ---
  {
    code: 'hiroshima-ekimae-ohashi',
    name: 'APA飯店〈廣島站前大橋〉',
    nameJa: 'アパホテル〈広島駅前大橋〉',
    region: '中國・四國',
    prefecture: '廣島縣',
    address: '廣島県廣島市南区京橋町2-26',
    lat: 34.3948,
    lng: 132.4715,
    phone: '082-568-6111',
    urlKey: 'chushikoku/hiroshima/hiroshima-ekimae-ohashi',
    tags: ['露天溫泉大浴場', '新幹線廣島站步行4分', '廣島和平公園'],
    notes: 'JR 廣島站南口步行 4 分鐘，設有大型露天人造溫泉大浴場。'
  },

  // --- 沖繩 (那霸) ---
  {
    code: 'naha-matsuyama',
    name: 'APA飯店〈那霸松山〉',
    nameJa: 'アパホテル〈那覇松山〉',
    region: '九州・沖繩',
    prefecture: '沖繩縣',
    address: '沖縄県那覇市松山1-4-16',
    lat: 26.2185,
    lng: 127.6812,
    phone: '098-868-9111',
    urlKey: 'kyushu/okinawa/naha-matsuyama',
    tags: ['國際通商圈', '大浴場', '單軌電車美榮橋站'],
    notes: '單軌電車美榮橋站步行約 7 分鐘，步行至國際通僅需 8 分鐘，附設人工溫泉大浴場。'
  },
  {
    code: 'naha-wakasa',
    name: 'APA飯店〈那霸若狹大通〉',
    nameJa: 'アパホテル〈那覇若狭大通〉',
    region: '九州・沖繩',
    prefecture: '沖繩縣',
    address: '沖縄県那覇市松山2-22-1',
    lat: 26.2205,
    lng: 127.6745,
    phone: '098-866-9111',
    urlKey: 'kyushu/okinawa/naha-wakasa',
    tags: ['波之上神宮旁', '大浴場', '海灘散步圈'],
    notes: '鄰近波之上沙灘與若狹大通，設有景觀大浴場。'
  },

  // --- 首都圈擴充 (秋葉原/池袋/淺草/銀座/品川/橫濱) ---
  {
    code: 'akihabara-ekimae',
    name: 'APA飯店〈秋葉原站前〉',
    nameJa: 'アパホテル〈秋葉原駅前〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都千代田区神田佐久間町2-13-20',
    lat: 35.6982,
    lng: 139.7745,
    phone: '03-5822-5111',
    urlKey: 'syutoken/tokyo/akihabara-ekimae',
    tags: ['秋葉原電氣街', 'JR昭和通口步行1分', '車站步行1分內'],
    notes: 'JR 秋葉原站昭和通口步行 1 分鐘，直達筑波快線與日比谷線。'
  },
  {
    code: 'akihabara-denkigai',
    name: 'APA飯店〈秋葉原站電氣街口〉',
    nameJa: 'アパホテル〈秋葉原駅電気街口〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都千代田区外神田3-11-4',
    lat: 35.7005,
    lng: 139.7712,
    phone: '03-5295-8111',
    urlKey: 'syutoken/tokyo/akihabara-denkigai',
    tags: ['動漫商圈核心', '電氣街中央通旁'],
    notes: '秋葉原電氣街核心中心，周邊動漫遊戲旗艦店林立。'
  },
  {
    code: 'asakusa-ekimae',
    name: 'APA飯店〈淺草站前〉',
    nameJa: 'アパホテル〈浅草駅前〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区駒形1-12-16',
    lat: 35.7092,
    lng: 139.7945,
    phone: '03-5830-0211',
    urlKey: 'syutoken/tokyo/asakusa-ekimae',
    tags: ['淺草雷門步行2分', '晴空塔展望', '車站步行1分內'],
    notes: '都營淺草線淺草站 A1 出口步行 1 分鐘，直達成田與羽田機場。'
  },
  {
    code: 'ikebukuro-kitaguchi',
    name: 'APA飯店〈池袋站北口〉',
    nameJa: 'アパホテル〈池袋駅北口〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都豊島区池袋2-48-7',
    lat: 35.7335,
    lng: 139.7110,
    phone: '03-5911-8111',
    urlKey: 'syutoken/tokyo/ikebukuro-kitaguchi',
    tags: ['池袋商圈', '大浴場', '車站步行4分內'],
    notes: '池袋站西口（北）出站步行 4 分鐘，池袋商圈生活機能極佳。'
  },
  {
    code: 'ginza-kyobashi',
    name: 'APA飯店〈銀座 京橋〉',
    nameJa: 'アパホテル〈銀座 京橋〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都中央区京橋3-6-7',
    lat: 35.6745,
    lng: 139.7705,
    phone: '03-5159-5311',
    urlKey: 'syutoken/tokyo/ginza-kyobashi',
    tags: ['銀座購物圈', '東京站步行圈', '地下鐵京橋站旁'],
    notes: '銀座線京橋站步行 1 分鐘，走路至東京站八重洲口僅約 8 分鐘。'
  },
  {
    code: 'shinagawa-sengakuji',
    name: 'APA飯店〈品川 泉岳寺站前〉',
    nameJa: 'アパホテル〈品川 泉岳寺駅前〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都港区高輪2-16-30',
    lat: 35.6385,
    lng: 139.7395,
    phone: '03-5475-6811',
    urlKey: 'syutoken/tokyo/shinagawa-sengakuji',
    tags: ['頂樓展望大浴場', '露天風呂', '直達羽田機場'],
    notes: '泉岳寺站 A2 出口徒步 1 分鐘，頂樓展望大浴場眺望東京鐵塔。'
  },
  {
    code: 'ryogoku-tower',
    name: 'APA飯店＆度假村〈兩國站塔〉',
    nameJa: 'アパホテル＆リゾート〈両国駅タワー〉',
    region: '關東',
    prefecture: '東京都',
    address: '東京都墨田区横網1-11-10',
    lat: 35.6965,
    lng: 139.7925,
    phone: '03-5625-8111',
    urlKey: 'syutoken/tokyo/ryogoku-tower',
    tags: ['大浴場', '露天水療風呂', '相撲國技館旁', '地下鐵直通'],
    notes: '31 層超大型度假型商旅，設有超大地下浴場與屋頂景觀泳池。'
  },
  {
    code: 'yokohama-bay-tower',
    name: 'APA飯店＆度假村〈橫濱海灣塔〉',
    nameJa: 'アパホテル＆リゾート〈横浜ベイタワー〉',
    region: '關東',
    prefecture: '神奈川縣',
    address: '神奈川県横浜市中区海岸通5-25-3',
    lat: 35.4525,
    lng: 139.6380,
    phone: '045-226-5111',
    urlKey: 'syutoken/kanagawa/yokohama-baytower',
    tags: ['2311間旗艦客房', '大浴場', '橫濱港未來景觀', '露天風呂'],
    notes: '全日本客房數最多的大型旗艦地標塔樓，設有超寬敞景觀大浴場。'
  },
  {
    code: 'yokohama-kannai',
    name: 'APA飯店〈橫濱關內〉',
    nameJa: 'アパホテル〈横浜関内〉',
    region: '關東',
    prefecture: '神奈川縣',
    address: '神奈川県横浜市中区住吉町3-37-2',
    lat: 35.4455,
    lng: 139.6355,
    phone: '045-650-6111',
    urlKey: 'syutoken/kanagawa/yokohama-kannai',
    tags: ['大浴場', '桑拿', '橫濱球場旁', '中華街步行圈'],
    notes: 'JR 關內站北口步行 3 分鐘，頂樓配有人工溫泉大浴場與桑拿。'
  },
  {
    code: 'kawasaki-ekimae',
    name: 'APA飯店〈川崎站前〉',
    nameJa: 'アパホテル〈川崎駅前〉',
    region: '關東',
    prefecture: '神奈川縣',
    address: '神奈川県川崎市川崎区砂子1-7-1',
    lat: 35.5295,
    lng: 139.7005,
    phone: '044-222-1111',
    urlKey: 'syutoken/kanagawa/kawasaki-ekimae',
    tags: ['川崎站步行5分', '羽田機場快線直通'],
    notes: 'JR 川崎站東口步行 5 分鐘，前往羽田機場與橫濱樞紐極為快速。'
  },

  // --- 近畿大區擴充 (新大阪/難波/心齋橋/京都/神戶) ---
  {
    code: 'shin-osaka-minami',
    name: 'APA飯店〈新大阪站南〉',
    nameJa: 'アパホテル〈新大阪駅南〉',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市淀川区西中島7-1-6',
    lat: 34.7305,
    lng: 135.5005,
    phone: '06-6302-8111',
    urlKey: 'kansai/osaka/shin-osaka-minami',
    tags: ['新幹線新大阪站', '大浴場', '地下鐵御堂筋線'],
    notes: 'JR 新大阪站正面出口步行 6 分鐘，地下鐵西中島南方站步行 3 分鐘。'
  },
  {
    code: 'osaka-tanimachi4',
    name: 'APA飯店〈大阪谷町四丁目站前〉',
    nameJa: 'アパホテル〈大阪谷町四丁目駅前〉',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区内本町1-3-12',
    lat: 34.6850,
    lng: 135.5190,
    phone: '06-6941-8111',
    urlKey: 'kansai/osaka/tanimachi4',
    tags: ['大浴場', '露天風呂', '大阪城公園旁', '車站步行1分內'],
    notes: '谷町四丁目站 8 號出口步行 1 分鐘，緊鄰大阪城天守閣與大手門。'
  },
  {
    code: 'namba-shinsaibashi',
    name: 'APA飯店〈難波心齋橋〉',
    nameJa: 'アパホテル〈なんば心斎橋〉',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区西心斎橋2-7-12',
    lat: 34.6695,
    lng: 135.4990,
    phone: '06-6214-8111',
    urlKey: 'kansai/osaka/namba-shinsaibashi',
    tags: ['心齋橋美國村', '道頓堀跑跑人旁', '商圈核心'],
    notes: '座落於美國村中心，步行至道頓堀與心齋橋筋商店街僅 3 分鐘。'
  },
  {
    code: 'kyoto-gion',
    name: 'APA飯店〈京都祇園 Excellence〉',
    nameJa: 'アパホテル〈京都祇園エクセレント〉',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市東山区祇園町南側555',
    lat: 35.0035,
    lng: 135.7765,
    phone: '075-551-2111',
    urlKey: 'kansai/kyoto/kyoto-gion',
    tags: ['八坂神社前', '祇園花見小路', '清水寺步行圈'],
    notes: '八坂神社正門斜對面，祇園散步觀光與和服體驗極佳據點。'
  },
  {
    code: 'kyoto-horikawa',
    name: 'APA飯店〈京都堀川通〉',
    nameJa: 'アパホテル〈京都駅堀川通〉',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市下京区油小路通塩小路下ル西油小路町1',
    lat: 34.9880,
    lng: 135.7535,
    phone: '075-341-6111',
    urlKey: 'kansai/kyoto/kyoto-horikawa',
    tags: ['頂樓大浴場', '露天風呂', '京都站烏丸口步行7分'],
    notes: 'JR 京都站烏丸中央口步行 7 分鐘，頂樓配有人工溫泉露天風呂。'
  },
  {
    code: 'kobe-sannomiya',
    name: 'APA飯店〈神戶三宮〉',
    nameJa: 'アパホテル〈神戸三宮〉',
    region: '近畿',
    prefecture: '兵庫縣',
    address: '兵庫県神戸市中央区八幡通4-2-18',
    lat: 34.6945,
    lng: 135.1955,
    phone: '078-272-2111',
    urlKey: 'kansai/hyogo/kobe-sannomiya',
    tags: ['神戶三宮樞紐', '神戶牛美食街', '車站步行5分內'],
    notes: 'JR 三之宮站東口步行 5 分鐘，神戶市區交通核心樞紐。'
  },

  // --- 中部與北陸擴充 (名古屋/金澤/富山) ---
  {
    code: 'nagoya-shinkansen-minami',
    name: 'APA飯店〈名古屋站新幹線口南〉',
    nameJa: 'アパホテル〈名古屋駅新幹線口南〉',
    region: '東海・甲信越・北陸',
    prefecture: '愛知縣',
    address: '愛知県名古屋市中村区椿町13-1',
    lat: 35.1685,
    lng: 136.8810,
    phone: '052-459-5111',
    urlKey: 'tokai/aichi/nagoya-shinkansen-minami',
    tags: ['大浴場', '新幹線口步行4分', '露天風呂'],
    notes: 'JR 名古屋站新幹線太閤通口步行 4 分鐘，頂樓附設人工溫泉大浴場。'
  },
  {
    code: 'kanazawa-chuo',
    name: 'APA飯店〈金澤中央〉',
    nameJa: 'アパホテル〈金沢中央〉',
    region: '東海・甲信越・北陸',
    prefecture: '石川縣',
    address: '石川県金沢市片町1-5-24',
    lat: 36.5615,
    lng: 136.6535,
    phone: '076-235-2111',
    urlKey: 'hokuriku/ishikawa/kanazawa-chuo',
    tags: ['片町美食街', '頂樓天然溫泉', '露天風呂'],
    notes: '金澤最繁華之香林坊・片町商圈，頂樓設有 100% 天然溫泉大浴場。'
  },
  {
    code: 'toyama-ekimae',
    name: 'APA飯店〈富山站前〉',
    nameJa: 'アパホテル〈富山駅前〉',
    region: '東海・甲信越・北陸',
    prefecture: '富山縣',
    address: '富山県富山市明輪町1-231',
    lat: 36.7005,
    lng: 137.2135,
    phone: '076-444-5111',
    urlKey: 'hokuriku/toyama/toyama-ekimae',
    tags: ['北陸新幹線富山站', '立山黑部阿爾卑斯門戶'],
    notes: 'JR 富山站南口步行 1 分鐘，立山黑部阿爾卑斯路線出發首選飯店。'
  },

  // --- 九州擴充 (博多/鹿兒島) ---
  {
    code: 'hakata-ekimae-2chome',
    name: 'APA飯店〈博多站前2丁目〉',
    nameJa: 'アパホテル〈博多駅前2丁目〉',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市博多区博多駅前2-11-12',
    lat: 33.5910,
    lng: 130.4165,
    phone: '092-432-8211',
    urlKey: 'kyushu/fukuoka/hakata-ekimae-2chome',
    tags: ['大浴場', '博多口步行4分', '博多祇園山笠'],
    notes: 'JR 博多站博多口步行 4 分鐘，設有露天風呂大浴場。'
  },
  {
    code: 'kagoshima-chuo',
    name: 'APA飯店〈鹿兒島中央站前〉',
    nameJa: 'アパホテル〈鹿児島中央駅前〉',
    region: '九州・沖繩',
    prefecture: '鹿兒島縣',
    address: '鹿児島県鹿児島市中央町21-25',
    lat: 31.5835,
    lng: 130.5435,
    phone: '099-253-1111',
    urlKey: 'kyushu/kagoshima/kagoshima-chuo',
    tags: ['九州新幹線終點', '櫻島火山觀光門戶'],
    notes: '九州新幹線鹿兒島中央站東口步行 2 分鐘，直通櫻島渡輪接駁。'
  },

  // --- 東北與中國地區擴充 (仙台/岡山/高松) ---
  {
    code: 'sendai-ekimae',
    name: 'APA飯店〈仙台站前〉',
    nameJa: 'アパホテル〈仙台駅前〉',
    region: '東北',
    prefecture: '宮城縣',
    address: '宮城県仙台市青葉区中央3-8-27',
    lat: 38.2615,
    lng: 140.8805,
    phone: '022-224-8111',
    urlKey: 'tohoku/miyagi/sendai-ekimae',
    tags: ['大浴場', '露天風呂', 'JR仙台站西口步行3分', '牛舌街'],
    notes: 'JR 仙台站西口步行 3 分鐘，頂樓附設人造溫泉露天風呂「玄要之湯」。'
  },
  {
    code: 'okayama-ekimae',
    name: 'APA飯店〈岡山站前〉',
    nameJa: 'アパホテル〈岡山駅前〉',
    region: '中國・四國',
    prefecture: '岡山縣',
    address: '岡山県岡山市北区下石井1-3-12',
    lat: 34.6645,
    lng: 133.9195,
    phone: '086-235-1111',
    urlKey: 'chushikoku/okayama/okayama-ekimae',
    tags: ['JR岡山站步行6分', 'Aeon Mall正對面', '山陽新幹線'],
    notes: '山陽新幹線岡山站東口步行 6 分鐘，正對面為西日本最大永旺夢樂城。'
  },
  {
    code: 'takamatsu-kawaramachi',
    name: 'APA飯店〈高松瓦町〉',
    nameJa: 'アパホテル〈高松瓦町〉',
    region: '中國・四國',
    prefecture: '香川縣',
    address: '香川県高松市福田町13-16',
    lat: 34.3395,
    lng: 134.0535,
    phone: '087-823-2323',
    urlKey: 'chushikoku/kagawa/takamatsu-kawaramachi',
    tags: ['大浴場', '露天風呂', '讚岐烏龍麵名店街', '琴電瓦町站旁'],
    notes: '琴電瓦町站步行 3 分鐘，高松市中心商圈，附設露天人造溫泉風呂。'
  }
];

export function saveApaSeed(stationsList = [], outDir = 'src/data') {
  const spots = buildApaHotels(APA_HOTELS_SEED, stationsList);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const targetPath = path.join(outDir, 'apa_seed.json');
  fs.writeFileSync(targetPath, JSON.stringify(spots, null, 2), 'utf8');
  console.log(`[APA] 成功儲存 ${spots.length} 筆 APA 飯店至 ${targetPath}`);
  return spots;
}

/**
 * 產生標準化的 APA 飯店資料集（自動配對最近車站、步行時間與設施標籤）
 * @param {Array<object>} [rawList=APA_HOTELS_SEED] 
 * @param {Array<object>} [stationsList] 
 * @returns {Array<object>}
 */
export function buildApaHotels(rawList = APA_HOTELS_SEED, stationsList = []) {
  const result = [];

  for (const h of rawList) {
    const lat = Number(h.lat);
    const lng = Number(h.lng);
    const id = h.id || `apa-${h.code || Math.random().toString(36).slice(2, 8)}`;

    // 車站配對
    const stationMatch = findNearestStation(lat, lng, stationsList);
    const stationName = stationMatch.station ? stationMatch.station.name : '鄰近車站';
    const walkMin = stationMatch.walkMinutes || 5;

    // 設施與亮點標籤
    let tags = [];
    if (Array.isArray(h.tags)) {
      tags = [...h.tags];
    } else if (typeof h.tags === 'string') {
      tags = h.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (walkMin <= 3 && !tags.includes('車站步行3分內')) {
      tags.push('車站步行3分內');
    }
    if (!tags.includes('全室大型液晶TV')) {
      tags.push('全室大型液晶TV');
    }
    if (!tags.includes('免費高速Wi-Fi')) {
      tags.push('免費高速Wi-Fi');
    }

    const bookingUrl = h.bookingUrl || `https://www.apahotel.com/hotel/${h.urlKey || ''}/`;
    const imageUrl = h.imageUrl || `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80`;

    result.push({
      id,
      category: '飯店',
      brand: 'APA飯店',
      name: h.name,
      nameJa: h.nameJa || h.name,
      region: h.region,
      prefecture: h.prefecture,
      nearestStation: stationName,
      stationLine: stationMatch.station?.lines?.[0] || 'JR / 地鐵',
      stationAccess: stationMatch.note || `鄰近 ${stationName} 步行約 ${walkMin} 分鐘`,
      walkMinutes: walkMin,
      address: h.address,
      coordinates: `${lat}, ${lng}`,
      lat,
      lng,
      phone: h.phone || '',
      bookingUrl,
      googleMapUrl: `https://maps.google.com/?q=${lat},${lng}`,
      imageUrl,
      images: [imageUrl],
      tags: tags.join(', '),
      notes: h.notes || '日本大型連鎖商務飯店，交通便利，設備完善。'
    });
  }

  // 去重與校驗
  const { uniqueSpots, duplicateCount } = deduplicateSpots(result);
  const validation = validateSpotsBatch(uniqueSpots);

  console.log(`[APA Scraper] 建置完成: 共 ${uniqueSpots.length} 間，去重: ${duplicateCount} 筆，有效驗證通過: ${validation.validCount} 間`);
  return uniqueSpots;
}
