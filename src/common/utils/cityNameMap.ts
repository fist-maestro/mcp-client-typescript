// 城市名映射表
export const CITY_NAME_MAP: { [key: string]: string } = {
  '北京': 'Beijing',
  '上海': 'Shanghai',
  '广州': 'Guangzhou',
  '深圳': 'Shenzhen',
  '香港': 'Hong Kong',
  '澳门': 'Macau',
  '台北': 'Taipei',
  '杭州': 'Hangzhou',
  '南京': 'Nanjing',
  '成都': 'Chengdu',
  '武汉': 'Wuhan',
  '西安': 'Xian',
  '重庆': 'Chongqing',
  '青岛': 'Qingdao',
  '厦门': 'Xiamen',
  '苏州': 'Suzhou',
  '天津': 'Tianjin',
  '长沙': 'Changsha',
  '郑州': 'Zhengzhou',
  '大连': 'Dalian'
};

/**
 * 将中文城市名转换为英文
 * @param chineseName 中文城市名
 * @returns 对应的英文城市名，如果没有对应关系则返回原名
 */
export function translateCityName(chineseName: string): string {
  return CITY_NAME_MAP[chineseName] || chineseName;
}

/**
 * 转换工具调用参数中的城市名
 * @param args 工具调用的参数对象
 * @returns 转换后的参数对象
 */
export function translateToolArguments(args: any): any {
  if (typeof args === 'string') {
    args = JSON.parse(args);
  }
  
  if (args.city && typeof args.city === 'string') {
    args.city = translateCityName(args.city);
  }
  
  return args;
} 