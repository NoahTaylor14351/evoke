import { randomBytes, scryptSync } from "node:crypto";
import readline from "node:readline";
if (!process.stdin.isTTY)
  throw Error("Run this command in an interactive terminal.");
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();
let password = "";
process.stdout.write("Staff password (at least 16 characters, input hidden): ");
process.stdin.on("keypress", (text, key) => {
  if (key?.ctrl && key.name === "c") {
    process.stdin.setRawMode(false);
    process.exit(1);
  }
  if (key?.name === "backspace") {
    password = password.slice(0, -1);
    return;
  }
  if (key?.name === "return") {
    process.stdin.setRawMode(false);
    if (password.length < 16) {
      process.stdout.write("\nPassword too short.\n");
      process.exit(1);
    }
    const salt = randomBytes(16);
    process.stdout.write(
      `\nADMIN_PASSWORD_HASH=scrypt:${salt.toString("hex")}:${scryptSync(password, salt, 64).toString("hex")}\n`,
    );
    password = "";
    process.exit(0);
  }
  if (text && !key?.ctrl) password += text;
});
