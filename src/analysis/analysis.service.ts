import { Injectable } from '@nestjs/common';
import { CreateAnalysisDto } from './dtos/create-analysis.dto';
import { UpdateAnalysisDto } from './dtos/update-analysis.dto';

@Injectable()
export class AnalysisService {
  create(createAnalysisDto: CreateAnalysisDto) {
    return 'This action adds a new analysis';
  }

  findAll() {
    return `This action returns all analysis`;
  }

  findOne(id: number) {
    return `This action returns a #${id} analysis`;
  }

  update(id: number, updateAnalysisDto: UpdateAnalysisDto) {
    return `This action updates a #${id} analysis`;
  }

  remove(id: number) {
    return `This action removes a #${id} analysis`;
  }
}
