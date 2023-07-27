import { IsOptional } from 'class-validator';

import { TaskStatus } from '../task.model';

export class GetTaskFilterDto {
  @IsOptional()
  status: TaskStatus;

  @IsOptional()
  search: string;
}
