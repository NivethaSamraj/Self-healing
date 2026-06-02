export class HealingLogger {

  static line(char: string = '═') {
    console.log(char.repeat(60));
  }

  static section(title: string) {
    console.log('\n');
    this.line();
    console.log(` ${title}`);
    this.line();
  }

  static subSection(title: string) {
    console.log('\n');
    console.log('─'.repeat(50));
    console.log(` ${title}`);
    console.log('─'.repeat(50));
  }

  static info(label: string, value: any) {
    console.log(
      `[${label.padEnd(12)}] ${value}`
    );
  }

  static success(message: string) {
    console.log(` SUCCESS  ${message}`);
  }

  static fail(message: string) {
    console.log(` FAILED   ${message}`);
  }

  static warn(message: string) {
    console.log(` WARNING  ${message}`);
  }

  static ai(message: string) {
    console.log(` AI       ${message}`);
  }
}