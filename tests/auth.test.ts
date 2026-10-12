import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DemoAuthForm as AuthForm } from "../src/components/demo-auth-form";
for (const props of [{}, { register: true }, { reset: true }]) {
  test(
    "demo form cannot serialize personal data before hydration: " +
      JSON.stringify(props),
    () => {
      const html = renderToStaticMarkup(createElement(AuthForm, props));
      assert.match(html, /<fieldset[^>]*disabled/);
      assert.doesNotMatch(html, /<(?:input|select)[^>]*\sname=/);
    },
  );
}
