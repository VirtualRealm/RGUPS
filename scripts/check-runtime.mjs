import { productionConfigIssues } from "../src/server/runtime-config.mjs";
const issues = productionConfigIssues(process.env);
if (issues.length) {
  console.error("Production account server configuration is incomplete:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else
  console.log("Production configuration validated. Secrets were not printed.");
