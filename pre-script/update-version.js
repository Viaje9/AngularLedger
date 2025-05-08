// update-version.js
// 自動遞增 src/app/core/constants/version.ts 的版本號
// 用法：在 commit 前執行此腳本

const fs = require("fs");
const path = require("path");

const versionFile = path.join(
  __dirname,
  "../src/app/core/constants/version.ts",
);

function incrementVersion(version) {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3) throw new Error("版本號格式錯誤");
  parts[2] += 1; // 遞增 patch
  return parts.join(".");
}

function updateVersionFile() {
  let content = fs.readFileSync(versionFile, "utf8");
  const match = content.match(/const version = '([0-9]+\.[0-9]+\.[0-9]+)';/);
  if (!match) throw new Error("找不到版本號");
  const oldVersion = match[1];
  const newVersion = incrementVersion(oldVersion);
  content = content.replace(
    /const version = '[0-9]+\.[0-9]+\.[0-9]+';/,
    `const version = '${newVersion}';`,
  );
  fs.writeFileSync(versionFile, content, "utf8");
  console.log(`版本號已從 ${oldVersion} 更新為 ${newVersion}`);
}

updateVersionFile();
