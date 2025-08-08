/**
 * 从对象中选取指定的键，返回一个新的对象。
 * @param data 源对象
 * @param keys 需要提取的键数组
 * @example
 *   const user = { name: 'Alice', age: 25, city: 'NYC' }
 *   console.log(pick(user, ['name', 'city'])) // { name: 'Alice', city: 'NYC' }
 * @returns 仅包含指定键的新对象
 */
export function pick<Data extends object, Keys extends keyof Data>(
    data: Data,
    keys: Keys[],
): Pick<Data, Keys> {
    const result = {} as Pick<Data, Keys>;

    for (const key of keys) {
        result[key] = data[key];
    }

    return result;
}

/**
 * 从对象中删除指定的键，返回一个新对象。
 * @param data 源对象
 * @param keys 需要删除的键数组
 * @example console.log(omit(user, ['age'])) // { name: 'Alice', city: 'NYC' }
 * @returns 删除指定键后的新对象
 */
export function omit<Data extends object, Keys extends keyof Data>(
    data: Data,
    keys: Keys[],
): Omit<Data, Keys> {
    const result = { ...data };

    for (const key of keys) {
        delete result[key];
    }

    return result as Omit<Data, Keys>;
}

/**
 * 根据路径获取对象的值。
 * @param object 目标对象
 * @param path 属性路径，可以是字符串或数组
 * @param defaultValue 如果路径不存在，返回的默认值
 * @example console.log(get(user, 'address.city', 'Unknown')) // 'Unknown'
 * @returns 目标值或默认值
 */
export function get(
    object: Record<string, any> | undefined,
    path: (string | number)[] | string,
    defaultValue?: any,
): any {
    if (typeof path === "string") {
        path = path.split(".").map((key) => {
            const numKey = Number(key);
            return Number.isNaN(numKey) ? key : numKey;
        });
    }

    let result: any = object;

    for (const key of path) {
        if (result === undefined || result === null) {
            return defaultValue;
        }

        result = result[key];
    }

    return result !== undefined ? result : defaultValue;
}

/**
 * 根据路径设置对象的值。
 * @param object 目标对象
 * @param path 属性路径，可以是字符串或数组
 * @param value 要设置的值
 * @example
 *   const newUser = { name: 'Alice', address: {} }
 *   set(newUser, 'address.city', 'NYC')
 *   console.log(newUser) // { name: 'Alice', address: { city: 'NYC' } }
 */
export function set(
    object: Record<string, any>,
    path: (string | number)[] | string,
    value: any,
): void {
    if (typeof path === "string") {
        path = path.split(".").map((key) => {
            const numKey = Number(key);
            return Number.isNaN(numKey) ? key : numKey;
        });
    }

    path.reduce((acc, key, i) => {
        if (acc[key] === undefined) acc[key] = {};
        if (i === path.length - 1) acc[key] = value;
        return acc[key];
    }, object);
}

/**
 * 尝试将值转换为数字。
 * @param val 输入值
 * @example
 *   console.log(looseToNumber('42.5')) // 42.5
 *   console.log(looseToNumber('abc')) // "abc"
 * @returns 转换后的数字或原值
 */
export function looseToNumber(val: any): any {
    const n = Number.parseFloat(val);
    return Number.isNaN(n) ? val : n;
}

/**
 * 比较两个值是否相等。
 * @param value 第一个值
 * @param currentValue 第二个值
 * @param comparator 比较方式，可以是字符串路径或自定义比较函数
 * @example
 *   console.log(compare('hello', 'hello')) // true
 *   console.log(compare({ name: 'Alice' }, { name: 'Alice' })) // true
 *   console.log(compare({ user: { id: 1 } }, { user: { id: 1 } }, 'user.id')) // true
 * @returns 是否相等
 */
export function compare<T>(
    value?: T,
    currentValue?: T,
    comparator?: string | ((a: T, b: T) => boolean),
) {
    if (value === undefined || currentValue === undefined) {
        return false;
    }

    if (typeof value === "string") {
        return value === currentValue;
    }

    if (typeof comparator === "function") {
        return comparator(value, currentValue);
    }

    if (typeof comparator === "string") {
        return get(value!, comparator) === get(currentValue!, comparator);
    }

    return JSON.stringify(value) === JSON.stringify(currentValue);
}

export * from "./date-helper";
