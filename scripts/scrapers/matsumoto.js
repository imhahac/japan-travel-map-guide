/**
 * =========================================================================
 * 松本清 (Matsumoto Kiyoshi) 門市爬蟲與資料模組
 * =========================================================================
 * 收錄全日本核心觀光商圈與車站出口最前線之松本清免稅藥妝門市。
 */

import { findNearestStation } from '../core/geo.js';
import { validateSpotsBatch } from '../core/validator.js';
import { deduplicateSpots } from '../core/dedupe.js';

export const MATSUKIYO_STORES_SEED = [
  // --- 東京首都圈 ---
  {
    code: 'shinjuku-east',
    name: '松本清 新宿東口店',
    nameJa: 'マツモトキヨシ 新宿東口店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都新宿区新宿3-22-6',
    lat: 35.6924,
    lng: 139.7022,
    phone: '03-5360-4231',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '車站步行2分內', '新宿商圈', '支援行動支付'],
    notes: '緊鄰 JR 新宿站東口，地下 1 樓至地上 3 樓藥品、美妝、保健品一應俱全。'
  },
  {
    code: 'shibuya-part1',
    name: '松本清 澀谷 Part 1 店',
    nameJa: 'マツモトキヨシ 渋谷Part1店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区宇田川町22-3',
    lat: 35.6601,
    lng: 139.6998,
    phone: '03-3463-8728',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '澀谷十字路口旁', '熱門美妝保養'],
    notes: '澀谷八公口十字路口步行 2 分鐘，外國觀光客超人氣採購點。'
  },
  {
    code: 'ginza-5chome',
    name: '松本清 銀座5丁目店',
    nameJa: 'マツモトキヨシ 銀座5丁目店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都中央区銀座5-5-1',
    lat: 35.6705,
    lng: 139.7635,
    phone: '03-3289-0260',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '銀座中央通', '高端專櫃品牌'],
    notes: '座落於銀座晴海通與中央通交會處，專櫃級美妝與專屬退稅通道。'
  },
  {
    code: 'ueno-ameyoko',
    name: '松本清 上野阿美橫丁店',
    nameJa: 'マツモトキヨシ 上野アメ横店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区上野4-7-17',
    lat: 35.7108,
    lng: 139.7745,
    phone: '03-3836-9730',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '阿美橫丁入口', '折扣力度大', '中文對應'],
    notes: '上野站不忍口正對面，阿美橫町熱門伴手禮與常備藥品免稅專賣。'
  },
  {
    code: 'ikebukuro-part2',
    name: '松本清 池袋 Part 2 店',
    nameJa: 'マツモトキヨシ 池袋Part2店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都豊島区東池袋1-22-8',
    lat: 35.7305,
    lng: 139.7152,
    phone: '03-5951-3181',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '太陽城通', '營業至深夜'],
    notes: '池袋東口太陽城 60 通道上，營業至深夜 23:00。'
  },
  {
    code: 'akihabara-ekimae',
    name: '松本清 秋葉原站前店',
    nameJa: 'マツモトキヨシ アキバ店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都千代田区外神田1-13-1',
    lat: 35.6985,
    lng: 139.7712,
    phone: '03-5297-8811',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '秋葉原站中央口旁', '車站步行1分內'],
    notes: 'JR 秋葉原站電氣街口出站即達。'
  },

  // --- 近畿關西圈 (大阪 / 京都 / 神戶) ---
  {
    code: 'osaka-shinsaibashi-chuo',
    name: '松本清 心齋橋中央店',
    nameJa: 'マツモトキヨシ 心斎橋中央店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区心斎橋筋2-1-21',
    lat: 34.6712,
    lng: 135.5008,
    phone: '06-6213-7761',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '心齋橋商店街核心', '中文店員常駐'],
    notes: '大阪最熱門的心齋橋筋商店街中央，台灣旅客掃貨首選據點。'
  },
  {
    code: 'osaka-ebisubashi',
    name: '松本清 難波戎橋店',
    nameJa: 'マツモトキヨシ 戎橋店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区難波1-5-16',
    lat: 34.6678,
    lng: 135.5015,
    phone: '06-6211-1378',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '道頓堀跑跑人橋旁', '難波站步行3分'],
    notes: '緊鄰道頓堀戎橋與固力果招牌，位置極度顯眼方便。'
  },
  {
    code: 'kyoto-shijo-kawaramachi',
    name: '松本清 京都四條河原町店',
    nameJa: 'マツモトキヨシ 四条河原町店',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市下京区四条通小橋西入真町88',
    lat: 35.0038,
    lng: 135.7705,
    phone: '075-257-2270',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '阪急河原町站出口', '祇園商圈'],
    notes: '阪急京都河原町站出口直達，前往祇園與鴨川必經。'
  },
  {
    code: 'kyoto-porta',
    name: '松本清 京都站前 Porta 店',
    nameJa: 'マツモトキヨシ 京都ポルタ店',
    region: '近畿',
    prefecture: '京都府',
    address: '京都府京都市下京区烏丸通塩小路下る東塩小路町902',
    lat: 34.9858,
    lng: 135.7588,
    phone: '075-343-2615',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '京都站地下街直通', '新幹線旁'],
    notes: '京都站地下街 Porta 內，搭乘新幹線或 HARUKA 前補貨最便利。'
  },

  // --- 九州 (福岡) ---
  {
    code: 'hakata-chikagai',
    name: '松本清 博多站地下街店',
    nameJa: 'マツモトキヨシ 博多駅地下街店',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市博多区博多駅中央街1-1 地下1F',
    lat: 33.5902,
    lng: 130.4195,
    phone: '092-474-0610',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '博多車站地下街直通', '全天候不受天氣影響'],
    notes: 'JR 博多站中央地下街直通，免出站即可完成免稅採買。'
  },

  // --- 北海道 (札幌) ---
  {
    code: 'sapporo-tanukikoji-3chome',
    name: '松本清 札幌狸小路3丁目店',
    nameJa: 'マツモトキヨシ 札幌狸小路Part2店',
    region: '北海道',
    prefecture: '北海道',
    address: '北海道札幌市中央区南2条西3丁目1-5',
    lat: 43.0575,
    lng: 141.3545,
    phone: '011-209-7030',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '狸小路商店街', '北海道藥妝伴手禮'],
    notes: '狸小路 3 丁目拱廊商店街內，馬油、保濕面膜與熱門藥品齊全。'
  },

  // --- 沖繩 (那霸) ---
  {
    code: 'naha-kokusaidori-chuo',
    name: '松本清 那霸國際通中央店',
    nameJa: 'マツモトキヨシ 国際通り店',
    region: '九州・沖繩',
    prefecture: '沖繩縣',
    address: '沖縄県那覇市松尾2-8-16',
    lat: 26.2158,
    lng: 127.6888,
    phone: '098-860-2670',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '國際通核心', '防曬美白專區'],
    notes: '那霸國際通中心地帶，沖繩限定美妝、防曬與伴手禮專賣。'
  },

  // --- 首都圈主要車站擴充 ---
  {
    code: 'harajuku-takeshita',
    name: '松本清 原宿竹下通店',
    nameJa: 'マツモトキヨシ 原宿竹下通り店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都渋谷区神宮前1-8-5',
    lat: 35.6712,
    lng: 139.7045,
    phone: '03-3478-4330',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '原宿竹下通', '潮流美妝推薦'],
    notes: '原宿竹下通核心商圈，年輕流行彩妝與保養品牌最齊全。'
  },
  {
    code: 'roppongi',
    name: '松本清 六本木店',
    nameJa: 'マツモトキヨシ 六本木店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都港区六本木4-11-11',
    lat: 35.6635,
    lng: 139.7328,
    phone: '03-3478-5771',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '六本木交差點', '深夜營業'],
    notes: '六本木交差點步行 1 分鐘，支援多國語言退稅與醫藥諮詢。'
  },
  {
    code: 'asakusa-nitenmon',
    name: '松本清 淺草二天門前店',
    nameJa: 'マツモトキヨシ 浅草二天門前店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都台東区浅草2-34-3',
    lat: 35.7148,
    lng: 139.7979,
    phone: '03-3847-1951',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '淺草寺周邊', '傳統伴手禮'],
    notes: '淺草寺二天門前，觀光客參拜後採購常備藥品熱門門市。'
  },
  {
    code: 'shinbashi-ginzaguchi',
    name: '松本清 新橋站銀座口店',
    nameJa: 'マツモトキヨシ 新橋駅銀座口店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都港区新橋1-13-3',
    lat: 35.6672,
    lng: 139.7592,
    phone: '03-3571-0810',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '新橋站步行1分', '上班族與商務客推薦'],
    notes: 'JR 新橋站銀座口出站即達，商務與差旅常備藥品迅速補給。'
  },
  {
    code: 'shinagawa-konan',
    name: '松本清 品川站港南口店',
    nameJa: 'マツモトキヨシ 品川駅港南口店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都港区港南2-2-1',
    lat: 35.6288,
    lng: 139.7408,
    phone: '03-5715-3850',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '品川新幹線站旁', '交通極為便利'],
    notes: 'JR 品川站港南口天橋直達，搭乘東海道新幹線前免稅採買首選。'
  },
  {
    code: 'yurakucho-itocia',
    name: '松本清 有樂町 ITOCiA 店',
    nameJa: 'マツモトキヨシ 有楽町イトシア店',
    region: '關東',
    prefecture: '東京都',
    address: '東京都千代田区有楽町2-7-1 地下1F',
    lat: 35.6748,
    lng: 139.7638,
    phone: '03-5224-6330',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '有樂町站地下連通', '銀座步行圈'],
    notes: '有樂町 ITOCiA 地下 1 樓，直通 JR 有樂町站與地鐵銀座站。'
  },
  {
    code: 'yokohama-west',
    name: '松本清 橫濱站西口店',
    nameJa: 'マツモトキヨシ 横浜駅西口店',
    region: '關東',
    prefecture: '神奈川縣',
    address: '神奈川県横浜市西区南幸1-5-1',
    lat: 35.4660,
    lng: 139.6212,
    phone: '045-316-5630',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '橫濱站西口天橋直達', '大型商場聚集'],
    notes: '橫濱站西口熱鬧商店街口，提供最齊全的開架化妝品與日用品。'
  },
  {
    code: 'kawasaki-ekimae',
    name: '松本清 川崎站前店',
    nameJa: 'マツモトキヨシ 川崎駅前店',
    region: '關東',
    prefecture: '神奈川縣',
    address: '神奈川県川崎市川崎区駅前本町2-11',
    lat: 35.5312,
    lng: 139.7001,
    phone: '044-245-8160',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '川崎站東口', '多國語音導覽'],
    notes: 'JR 川崎站東口地下街出口旁，羽田機場進出旅客之便利補給站。'
  },

  // --- 中部 / 東海 / 北陸 ---
  {
    code: 'nagoya-sakae',
    name: '松本清 名古屋榮店',
    nameJa: 'マツモトキヨシ 名古屋栄店',
    region: '中部',
    prefecture: '愛知縣',
    address: '愛知県名古屋市中区栄3-4-15',
    lat: 35.1685,
    lng: 136.9078,
    phone: '052-259-2680',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '名古屋榮商圈', '地下街直通'],
    notes: '名古屋最精華的榮商圈，多樓層展示熱門美妝與退稅專櫃。'
  },
  {
    code: 'nagoya-meieki-taiko',
    name: '松本清 名驛太閤通口店',
    nameJa: 'マツモトキヨシ 名駅太閤通口店',
    region: '中部',
    prefecture: '愛知縣',
    address: '愛知県名古屋市中村区椿町6-9',
    lat: 35.1702,
    lng: 136.8805,
    phone: '052-459-3380',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '名古屋站新幹線口', '車站步行2分'],
    notes: '緊鄰 JR 名古屋站太閤通口（新幹線出入口），旅客出發前必訪。'
  },
  {
    code: 'kanazawa-ekimae',
    name: '松本清 金澤站西口店',
    nameJa: 'マツモトキヨシ 金沢駅西口店',
    region: '中部',
    prefecture: '石川縣',
    address: '石川県金沢市広岡1-9-1',
    lat: 36.5788,
    lng: 136.6472,
    phone: '076-260-8820',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '北陸新幹線旁', '金澤站直達'],
    notes: 'JR 金澤站西口商業設施內，北陸新幹線與特急轉乘便利。'
  },

  // --- 近畿關西擴充 ---
  {
    code: 'umeda-hankyu-sanbangai',
    name: '松本清 梅田阪急三番街店',
    nameJa: 'マツモトキヨシ 阪急三番街店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市北区芝田1-1-3 阪急三番街南館B1F',
    lat: 34.7042,
    lng: 135.4988,
    phone: '06-6372-6800',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '大阪梅田站直通', '地下街全天候'],
    notes: '阪急大阪梅田站地下三番街直結，轉乘阪急、JR 與地鐵極其便利。'
  },
  {
    code: 'namba-sennichimae',
    name: '松本清 難波千日前店',
    nameJa: 'マツモトキヨシ なんば千日前店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市中央区難波千日前13-10',
    lat: 34.6652,
    lng: 135.5028,
    phone: '06-6630-7110',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '千日前商店街', '難波站步行3分'],
    notes: '緊鄰千日前道具屋筋與難波 Grand Kagetsu，美食與購物集中地。'
  },
  {
    code: 'tennoji-abeno',
    name: '松本清 天王寺阿倍野店',
    nameJa: 'マツモトキヨシ あべのキューズモール店',
    region: '近畿',
    prefecture: '大阪府',
    address: '大阪府大阪市阿倍野区阿倍野筋1-6-1',
    lat: 34.6465,
    lng: 135.5132,
    phone: '06-6636-2210',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '阿倍野 HARUKAS 旁', '天王寺轉乘中心'],
    notes: '天王寺站與阿倍野 Q\'s Mall 直結，關空特急 HARUKA 直達起訖點。'
  },
  {
    code: 'kobe-sannomiya-chuo',
    name: '松本清 神戶三宮中央通店',
    nameJa: 'マツモトキヨシ 神戸三宮中央通り店',
    region: '近畿',
    prefecture: '兵庫縣',
    address: '兵庫県神戸市中央区三宮町1-6-16',
    lat: 34.6912,
    lng: 135.1925,
    phone: '078-335-1880',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '神戶三宮中心街', '神戶牛商圈周邊'],
    notes: '三宮 Center 街心臟地帶，神戶港觀光客補貨必逛。'
  },

  // --- 中國 / 四國 / 東北 ---
  {
    code: 'hiroshima-hondori',
    name: '松本清 廣島本通店',
    nameJa: 'マツモトキヨシ 広島本通店',
    region: '中國',
    prefecture: '廣島縣',
    address: '広島県広島市中区本通1-18',
    lat: 34.3928,
    lng: 132.4592,
    phone: '082-545-7760',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '廣島本通拱廊商店街', '和平紀念公園步行圈'],
    notes: '廣島市中心本通商店街核心，原爆圓頂館與紙屋町交通便利。'
  },
  {
    code: 'okayama-ichibangai',
    name: '松本清 岡山站一番街店',
    nameJa: 'マツモトキヨシ 岡山一番街店',
    region: '中國',
    prefecture: '岡山縣',
    address: '岡山県岡山市北区駅元町一番街地下2号',
    lat: 34.6658,
    lng: 133.9185,
    phone: '086-235-0810',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '岡山站地下街直結', '山陽新幹線交通樞紐'],
    notes: 'JR 岡山站地下街一番街內，前往四國與山陰門戶之免稅專賣店。'
  },
  {
    code: 'sendai-chuo',
    name: '松本清 仙台中央通店',
    nameJa: 'マツモトキヨシ 仙台中央通り店',
    region: '東北',
    prefecture: '宮城縣',
    address: '宮城県仙台市青葉区中央2-5-5',
    lat: 38.2612,
    lng: 140.8778,
    phone: '022-722-1820',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '仙台 Clis Road 商店街', 'JR 仙台站西口步行5分'],
    notes: '東北第一大城仙台中央商店街內，東北新幹線旅客常備採購據點。'
  },

  // --- 九州擴充 ---
  {
    code: 'fukuoka-tenjin-nishi',
    name: '松本清 福岡天神西通店',
    nameJa: 'マツモトキヨシ 天神西通り店',
    region: '九州・沖繩',
    prefecture: '福岡縣',
    address: '福岡県福岡市中央区天神2-7-20',
    lat: 33.5898,
    lng: 130.3982,
    phone: '092-739-6520',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '天神西通潮流商圈', '一蘭拉麵總店旁'],
    notes: '九州最繁華的天神商圈西通上，各大精品與美食林立。'
  },
  {
    code: 'kumamoto-shimotori',
    name: '松本清 熊本下通店',
    nameJa: 'マツモトキヨシ 熊本下通店',
    region: '九州・沖繩',
    prefecture: '熊本縣',
    address: '熊本県熊本市中央区下通1-3-8',
    lat: 32.8005,
    lng: 130.7072,
    phone: '096-311-5760',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '熊本下通拱廊街', '熊本城周邊'],
    notes: '熊本市核心下通商店街內，熊本城步行可達，觀光退稅人氣店。'
  },
  {
    code: 'kagoshima-tenmonkan',
    name: '松本清 鹿兒島天文館店',
    nameJa: 'マツモトキヨシ 天文館店',
    region: '九州・沖繩',
    prefecture: '鹿兒島縣',
    address: '鹿児島県鹿児島市東千石町13-14',
    lat: 31.5915,
    lng: 130.5548,
    phone: '099-219-3350',
    url: 'https://www.matsukiyococokara-online.com/',
    tags: ['免稅 (Tax-Free)', '天文館電車通', '南九州最大商圈'],
    notes: '鹿兒島市電天文館通電停旁，南九州旅行必逛藥妝據點。'
  }
];

/**
 * 建置標準化松本清門市資料集
 * @param {Array<object>} [rawList=MATSUKIYO_STORES_SEED] 
 * @param {Array<object>} [stationsList=[]] 
 * @returns {Array<object>}
 */
export function buildMatsukiyoStores(rawList = MATSUKIYO_STORES_SEED, stationsList = []) {
  const result = [];

  for (const s of rawList) {
    const lat = Number(s.lat);
    const lng = Number(s.lng);
    const id = s.id || `matsukiyo-${s.code || Math.random().toString(36).slice(2, 8)}`;

    const stationMatch = findNearestStation(lat, lng, stationsList);
    const stationName = stationMatch.station ? stationMatch.station.name : '鄰近車站';
    const walkMin = stationMatch.walkMinutes || 3;

    let tags = [];
    if (Array.isArray(s.tags)) {
      tags = [...s.tags];
    } else if (typeof s.tags === 'string') {
      tags = s.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (!tags.includes('免稅 (Tax-Free)')) {
      tags.unshift('免稅 (Tax-Free)');
    }
    if (walkMin <= 3 && !tags.includes('車站步行3分內')) {
      tags.push('車站步行3分內');
    }

    const bookingUrl = s.url || s.bookingUrl || 'https://www.matsukiyococokara-online.com/';
    const imageUrl = s.imageUrl || 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=800&q=80';

    result.push({
      id,
      category: '購物藥妝',
      brand: '松本清',
      name: s.name,
      nameJa: s.nameJa || s.name,
      region: s.region,
      prefecture: s.prefecture,
      nearestStation: stationName,
      stationLine: stationMatch.station?.lines?.[0] || 'JR / 地鐵',
      stationAccess: stationMatch.note || `鄰近 ${stationName} 步行約 ${walkMin} 分鐘`,
      walkMinutes: walkMin,
      address: s.address,
      coordinates: `${lat}, ${lng}`,
      lat,
      lng,
      phone: s.phone || '',
      bookingUrl,
      googleMapUrl: `https://maps.google.com/?q=${lat},${lng}`,
      imageUrl,
      images: [imageUrl],
      tags: tags.join(', '),
      notes: s.notes || '日本大型知名連鎖藥妝店，提供免稅服務與豐富的美妝保養品。'
    });
  }

  const { uniqueSpots, duplicateCount } = deduplicateSpots(result);
  const validation = validateSpotsBatch(uniqueSpots);
  console.log(`[Matsukiyo Scraper] 建置完成: 共 ${uniqueSpots.length} 間，去重: ${duplicateCount} 筆，有效通過: ${validation.validCount} 間`);

  return uniqueSpots;
}
