/**
 * Minimal refractor instance — only the languages we actually map in
 * `getRefractorLanguage` (`src/lib/highlight.ts`) are registered.
 *
 * Using `refractor/core` + selective `register()` calls keeps the bundle smaller
 * than `import refractor from "refractor"` (which registers every supported
 * language). Keep this list in sync with `LANGUAGE_TO_REFRACTOR` values.
 *
 * Dependency order matters — languages that extend others must be registered
 * after their base.
 */
import { refractor } from "refractor/core";

import clike from "refractor/clike";
import javascript from "refractor/javascript";
import jsx from "refractor/jsx";
import typescript from "refractor/typescript";
import tsx from "refractor/tsx";
import markup from "refractor/markup";
import css from "refractor/css";
import cssExtras from "refractor/css-extras";
import scss from "refractor/scss";
import less from "refractor/less";
import json from "refractor/json";
import yaml from "refractor/yaml";
import markdown from "refractor/markdown";
import python from "refractor/python";
import ruby from "refractor/ruby";
import go from "refractor/go";
import rust from "refractor/rust";
import java from "refractor/java";
import kotlin from "refractor/kotlin";
import swift from "refractor/swift";
import c from "refractor/c";
import cpp from "refractor/cpp";
import csharp from "refractor/csharp";
import php from "refractor/php";
import sql from "refractor/sql";
import bash from "refractor/bash";
import powershell from "refractor/powershell";
import docker from "refractor/docker";
import makefile from "refractor/makefile";
import cmake from "refractor/cmake";
import toml from "refractor/toml";
import ini from "refractor/ini";
import nginx from "refractor/nginx";

refractor.register(markup);
refractor.register(clike);
refractor.register(css);
refractor.register(cssExtras);
refractor.register(javascript);
refractor.register(json);
refractor.register(markdown);
refractor.register(less);
refractor.register(scss);
refractor.register(yaml);
refractor.register(tsx);
refractor.register(jsx);
refractor.register(typescript);
refractor.register(python);
refractor.register(ruby);
refractor.register(go);
refractor.register(rust);
refractor.register(java);
refractor.register(kotlin);
refractor.register(swift);
refractor.register(c);
refractor.register(cpp);
refractor.register(csharp);
refractor.register(php);
refractor.register(sql);
refractor.register(bash);
refractor.register(powershell);
refractor.register(docker);
refractor.register(makefile);
refractor.register(cmake);
refractor.register(toml);
refractor.register(ini);
refractor.register(nginx);

const highlight: typeof refractor.highlight = (value, language) =>
  refractor.highlight(value, language).children as unknown as ReturnType<
    typeof refractor.highlight
  >;

const diffRefractor = {
  highlight,
  registered: (language: string) => refractor.registered(language),
};

export default diffRefractor;
