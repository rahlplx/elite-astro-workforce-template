export class SkillExecutionError extends Error {
  constructor(
    message: string,
    public component: string,
    public attempt: number
  ) {
    super(message);
    this.name = 'SkillExecutionError';
  }
}
