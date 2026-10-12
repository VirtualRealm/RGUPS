import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthForm } from "../src/components/auth-form";

for (const props of [{}, { register: true }, { reset: true }]) {
  test(`live account form cannot submit credentials before hydration: ${JSON.stringify(props)}`, () => {
    const html = renderToStaticMarkup(createElement(AuthForm, props));
    assert.match(html, /<fieldset[^>]*disabled=""/);
    const outside = html.replace(/<fieldset[\s\S]*?<\/fieldset>/g, "");
    assert.doesNotMatch(outside, /<(?:input|select|textarea)[^>]*\bname=/);
    assert.doesNotMatch(html, /localStorage|sessionStorage/);
  });
}
