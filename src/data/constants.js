// 서비스 분야: DB의 SERVICE_CATEGORIES 기준
export const SERVICE_CATEGORY_GROUPS = [
  {
    id: 1,
    name: '취업/직무',
    children: [
      { id: 2, name: '취업 준비' },
      { id: 3, name: '창업 준비' },
      { id: 4, name: '시험/자격증' },
      { id: 5, name: '기타 실무' },
    ],
  },
  {
    id: 6,
    name: '취미/자기계발',
    children: [
      { id: 7, name: '음악이론/보컬' },
      { id: 8, name: '미술/드로잉' },
      { id: 9, name: '연기/마술' },
      { id: 10, name: '기타 취미/자기계발' },
    ],
  },
  {
    id: 11,
    name: '과외',
    children: [
      { id: 12, name: '국내 입시' },
      { id: 13, name: '유학 준비' },
      { id: 14, name: '체육' },
      { id: 15, name: '무용/댄스' },
    ],
  },
  {
    id: 16,
    name: '외주',
    children: [
      { id: 17, name: '디자인 외주' },
      { id: 18, name: '개발 외주' },
      { id: 19, name: '번역 외주' },
      { id: 20, name: '마케팅' },
    ],
  },
  {
    id: 21,
    name: '기타',
    children: [
      { id: 22, name: '심리' },
      { id: 23, name: '번역 작업' },
      { id: 24, name: '심부름' },
    ],
  },
];

// 기존 코드 깨짐 방지용
export const CATEGORIES = SERVICE_CATEGORY_GROUPS.map(({ id, name }) => ({
  id,
  name,
}));

export const SERVICE_CATEGORIES = SERVICE_CATEGORY_GROUPS.flatMap((group) =>
  group.children.map((child) => ({
    ...child,
    parentId: group.id,
    parentName: group.name,
  }))
);

// 활동 지역: DB의 LOCATIONS 기준
export const LOCATION_GROUPS = [
  {
    id: 2,
    name: '서울',
    children: [
      { id: 3, name: '서울 전체' },
      { id: 4, name: '강남구' },
      { id: 5, name: '강동구' },
      { id: 6, name: '강북구' },
      { id: 7, name: '강서구' },
      { id: 8, name: '관악구' },
      { id: 9, name: '광진구' },
      { id: 10, name: '구로구' },
      { id: 11, name: '금천구' },
      { id: 12, name: '노원구' },
      { id: 13, name: '도봉구' },
      { id: 14, name: '마포구' },
      { id: 15, name: '서초구' },
      { id: 16, name: '송파구' },
      { id: 17, name: '영등포구' },
      { id: 18, name: '종로구' },
      { id: 19, name: '중구' },
    ],
  },
  {
    id: 20,
    name: '경기',
    children: [
      { id: 21, name: '경기 전체' },
      { id: 22, name: '고양시' },
      { id: 23, name: '성남시' },
      { id: 24, name: '수원시' },
      { id: 25, name: '용인시' },
      { id: 26, name: '부천시' },
      { id: 27, name: '안양시' },
    ],
  },
  {
    id: 28,
    name: '인천',
    children: [
      { id: 29, name: '인천 전체' },
      { id: 30, name: '부평구' },
      { id: 31, name: '남동구' },
      { id: 32, name: '연수구' },
    ],
  },
  {
    id: 33,
    name: '강원',
    children: [
      { id: 34, name: '강원 전체' },
      { id: 35, name: '강릉시' },
      { id: 36, name: '고성군' },
      { id: 37, name: '춘천시' },
      { id: 38, name: '원주시' },
    ],
  },
  {
    id: 39,
    name: '충북',
    children: [
      { id: 40, name: '충북 전체' },
      { id: 41, name: '청주시' },
      { id: 42, name: '충주시' },
    ],
  },
  {
    id: 43,
    name: '충남',
    children: [
      { id: 44, name: '충남 전체' },
      { id: 45, name: '천안시' },
      { id: 46, name: '아산시' },
    ],
  },
  {
    id: 47,
    name: '경북',
    children: [
      { id: 48, name: '경북 전체' },
      { id: 49, name: '포항시' },
      { id: 50, name: '경주시' },
    ],
  },
  {
    id: 51,
    name: '경남',
    children: [
      { id: 52, name: '경남 전체' },
      { id: 53, name: '창원시' },
      { id: 54, name: '김해시' },
    ],
  },
  {
    id: 55,
    name: '대전',
    children: [{ id: 56, name: '대전 전체' }],
  },
  {
    id: 57,
    name: '대구',
    children: [{ id: 58, name: '대구 전체' }],
  },
  {
    id: 59,
    name: '광주',
    children: [{ id: 60, name: '광주 전체' }],
  },
  {
    id: 61,
    name: '부산',
    children: [{ id: 62, name: '부산 전체' }],
  },
  {
    id: 63,
    name: '울산',
    children: [{ id: 64, name: '울산 전체' }],
  },
  {
    id: 65,
    name: '전북',
    children: [{ id: 66, name: '전북 전체' }],
  },
  {
    id: 67,
    name: '전남',
    children: [{ id: 68, name: '전남 전체' }],
  },
  {
    id: 69,
    name: '세종',
    children: [{ id: 70, name: '세종 전체' }],
  },
  {
    id: 71,
    name: '제주',
    children: [{ id: 72, name: '제주 전체' }],
  },
];

// 기존 코드 깨짐 방지용
export const SERVICE_LOCATIONS = LOCATION_GROUPS.flatMap((group) =>
  group.children.map((child) => ({
    ...child,
    parentId: group.id,
    parentName: group.name,
  }))
);

export const REGIONS = SERVICE_LOCATIONS;