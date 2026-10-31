export const toggleItem = (list, item) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
