export function must<T>(value: T | undefined, expectation: string): T {
  if (value === undefined) {
    throw new Error(`Expected ${expectation}`);
  }
  return value;
}

export function mustGet<V>(map: Map<string, V>, key: string): V {
  return must(map.get(key), `"${key}" to be registered`);
}

export function mustFind<T>(
  items: readonly T[],
  predicate: (item: T) => boolean,
  label: string,
): T {
  return must(items.find(predicate), `${label} to be registered`);
}
