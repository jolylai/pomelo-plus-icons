import path from "path";
import { globby } from "globby";
import { emptyDir, readFile, writeFile } from "fs-extra";
import camelcase from "camelcase";
import { format } from "prettier";
import type { BuiltInParserName } from "prettier";

import { pathSrc, pathSvg } from "./paths";

const getSvgFiles = async () => {
  return await globby("*.svg", {
    absolute: true,
    cwd: pathSvg,
  });
};

const getName = (file: string) => {
  const filename = path.basename(file, ".svg");
  const componentName = camelcase(filename, { pascalCase: true });

  return { filename, componentName };
};

const formatCode = (code: string, parser: BuiltInParserName = "typescript") => {
  return format(code, {
    parser,
  });
};

const transformToVueComponent = async (file: string) => {
  const content = await readFile(file, "utf-8");
  const { filename, componentName } = getName(file);

  const code = `
  <template>
    ${content}
  </template>

  <script lang="'ts">
  import { defineComponent } from 'vue'
  
  export default defineComponent({
    name: "${componentName}"
  })
  </script>`;

  const vue = formatCode(code, "vue");

  await writeFile(path.resolve(pathSrc, `${filename}.vue`), vue, "utf-8");
};

const generateEntry = async (files: string[]) => {
  const code = files
    .map((file) => {
      const { filename, componentName } = getName(file);
      return `export {default as ${componentName}} from './${filename}.vue'`;
    })
    .join("\n");

  await writeFile(path.resolve(pathSrc, "index.ts"), formatCode(code), "utf-8");
};

(async () => {
  await emptyDir(pathSrc);

  // 1、获取所有svg 文件
  const files = await getSvgFiles();
  console.log("files: ", files);

  // 2、将 svg 文件转换成 vue 文件
  await Promise.all(files.map((file) => transformToVueComponent(file)));

  // 3、 生成入口文件
  await generateEntry(files);
})();
