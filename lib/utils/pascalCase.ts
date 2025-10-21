export function pascalCase(input: string) {
  return input
    .replace(/(^\w|[-_\s]\w)/g, (m) => m.replace(/[-_\s]/g, "").toUpperCase())
    .replace(/[^A-Za-z0-9]/g, "");
}
