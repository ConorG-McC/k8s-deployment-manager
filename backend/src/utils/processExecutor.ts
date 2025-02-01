import { ChildProcess, exec } from 'child_process';
import { IProcessExecutor } from 'data-types';

export class ProcessExecutor implements IProcessExecutor {
  execCommand(command: string): ChildProcess {
    return exec(command);
  }
}
