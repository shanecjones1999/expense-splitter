import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

describe('GroupsController', () => {
  let groupsController: GroupsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        {
          provide: GroupsService,
          useValue: {},
        },
      ],
    }).compile();

    groupsController = app.get<GroupsController>(GroupsController);
  });

  it('should be defined', () => {
    expect(groupsController).toBeDefined();
  });
});
