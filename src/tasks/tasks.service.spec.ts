import { Test } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { TaskStatus } from './task-status.enum';
import { NotFoundException } from '@nestjs/common';
import { User } from 'src/auth/user.entiry';

const mockTasksRepository = () => ({
  getTasks: jest.fn(),
  findOne: jest.fn(),
  createTask: jest.fn(),
  delete: jest.fn(),
  save: jest.fn(),
});

const mockUser = {
  username: 'Prasenjit',
  id: 'someId',
  password: 'somePassword',
  tasks: [],
};

const mockTask = {
  id: 'someId',
  title: 'Test title',
  description: 'Test description',
  status: TaskStatus.OPEN,
};

describe('TasksService', () => {
  let tasksService: TasksService;
  let tasksRepository;

  // Need to create a fresh module with TasksService and TaksRepository before each test
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TasksRepository, useFactory: mockTasksRepository },
      ],
    }).compile();

    tasksService = module.get(TasksService);
    tasksRepository = module.get(TasksRepository);
  });

  describe('getTasks', () => {
    it('calls TasksRepository.getTasks and returns the result', async () => {
      tasksRepository.getTasks.mockResolvedValue('someValue');
      const result = await tasksService.getTasks(null, mockUser);
      expect(result).toEqual('someValue');
    });
  });

  describe('getTaskById', () => {
    it('calls tasksRepository.findOne and returns the result', async () => {
      tasksRepository.findOne.mockResolvedValue(mockTask);

      const result = await tasksService.getTaskById('someId', mockUser);
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task is not found', async () => {
      tasksRepository.findOne.mockResolvedValue(null);
      expect(tasksService.getTaskById('someid', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createTask', () => {
    it('calls tasksRepository.createTask and returns the result', async () => {
      tasksRepository.createTask.mockResolvedValue(mockTask);

      const result = await tasksService.createTask(null, mockUser);
      expect(result).toEqual(mockTask);
    });
  });

  describe('deleteTask', () => {
    it('calls tasksRepository.delete and deletes the task', async () => {
      const mockTaskId = 'mock-task-id';
      tasksRepository.delete.mockResolvedValue({ affected: 1 });

      await tasksService.deleteTask(mockTaskId, mockUser);
      expect(tasksRepository.delete).toHaveBeenCalledWith({
        id: mockTaskId,
        user: mockUser,
      });
    });

    it('should throw NotFoundException if task is not found', async () => {
      const mockTaskId = 'non-existent-task-id';
      tasksRepository.delete.mockResolvedValue({ affected: 0 });

      expect(tasksService.deleteTask(mockTaskId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateTaskStatus', () => {
    it('calls tasksService.getTaskById, tasksRepository.save and returns the updated task', async () => {
      const mocKTaskId = 'mock-task-id';
      mockTask.id = mocKTaskId;

      tasksService.getTaskById = jest.fn().mockResolvedValue(mockTask);
      tasksRepository.save.mockResolvedValue(mockTask);

      const updatedTask = await tasksService.updateTaskStatus(
        mocKTaskId,
        TaskStatus.IN_PROGRESS,
        mockUser,
      );

      expect(updatedTask).toEqual({
        id: mocKTaskId,
        title: 'Test title',
        description: 'Test description',
        status: TaskStatus.IN_PROGRESS,
      });

      expect(tasksRepository.save).toHaveBeenCalledWith(mockTask);
    });

    it('should throw NotFoundException if task is not found', async () => {
      const mockTaskId = 'non-existent-task-id';

      tasksService.getTaskById = jest
        .fn()
        .mockRejectedValue(new NotFoundException());

      await expect(
        tasksService.updateTaskStatus(
          mockTaskId,
          TaskStatus.IN_PROGRESS,
          mockUser,
        ),
      ).rejects.toThrowError(NotFoundException);
    });
  });
});
