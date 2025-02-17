import { ChildProcess, exec } from 'child_process';

export interface IProcessExecutor {
  execCommand(command: string): ChildProcess;
}

export class ProcessExecutor implements IProcessExecutor {
  execCommand(command: string): ChildProcess {
    return exec(command);
  }
}
