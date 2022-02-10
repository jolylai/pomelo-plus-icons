import { emptyDir } from "fs-extra";
import path from "path";
import { rollup } from "rollup";
import esbuild from "rollup-plugin-esbuild";
import vue from "unplugin-vue/rollup";

const pathSrc = path.join(__dirname, "../src");
const pathOutput = path.join(__dirname, "../dist");

(async () => {
  await emptyDir(pathOutput);

  const bundle = await rollup({
    input: [path.resolve(pathSrc, "index.ts")],
    plugins: [
      vue(),
      esbuild({
        target: "es2018",
      }),
    ],
    external: ["vue"],
  });

  await Promise.all([
    bundle.write({
      format: "es",
      dir: path.resolve(pathOutput, "es"),
      // 保留模块目录结构，不然打包到一个文件中
      preserveModules: true,
      entryFileNames: "[name].mjs",
    }),
    bundle.write({
      format: "cjs",
      dir: path.resolve(pathOutput, "lib"),
      preserveModules: true,
      // Specify export mode (auto, default, named, none)
      exports: "named",
    }),
    bundle.write({
      format: "umd",
      file: path.resolve(pathOutput, "index.js"),
      name: "ElementPlusIconsVue",
      globals: { vue: "Vue" },
    }),
    bundle.write({
      format: "esm",
      file: path.resolve(pathOutput, "index.mjs"),
    }),
  ]);
})();
