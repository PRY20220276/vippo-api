import { PartialType } from '@nestjs/swagger';
import { CreateAnalysisDto } from './create-analysis.dto';

export class UpdateAnalysisDto extends PartialType(CreateAnalysisDto) {}
