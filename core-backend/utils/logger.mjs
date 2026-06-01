import chalk from "chalk";

class Logger {
  SUCCESSFUL(msg = "") {
    return console.log(chalk.blueBright(`=> ${msg}`));
  }
  ERROR(msg = "") {
    return console.log(chalk.redBright(`=> ${msg}`));
  }
  WARN(msg = "") {
    return console.log(chalk.yellowBright(`=> ${msg}`));
  }
  PENDING(msg = "") {
    return console.log(chalk.greenBright(`=> ${msg}`));
  }
}
// instantiated logger for typical usage. Export the instance as `logger`
// to avoid colliding with the `Logger` class name.
export const logger = new Logger();
export default logger;
