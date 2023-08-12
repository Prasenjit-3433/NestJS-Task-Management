import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersRepository } from './users.repository';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

const mockUsersRepository = () => ({
  createUser: jest.fn(),
  findOne: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(),
});

const mockAuthCredentialsDto: AuthCredentialsDto = {
  username: 'testuser',
  password: 'testpassword',
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersRepository;
  let jwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useFactory: mockUsersRepository },
        { provide: JwtService, useFactory: mockJwtService },
      ],
    }).compile();

    authService = module.get(AuthService);
    usersRepository = module.get(UsersRepository);
    jwtService = module.get(JwtService);
  });

  describe('signUp', () => {
    it('calls usersRepository.createUser', async () => {
      usersRepository.createUser.mockResolvedValue(null);

      await authService.signUp(mockAuthCredentialsDto);
      expect(usersRepository.createUser).toHaveBeenCalledWith(
        mockAuthCredentialsDto,
      );
    });
  });

  describe('signIn', () => {
    it('calls usersRepository.findOne and returns an access token', async () => {
      const mockedUser = {
        username: 'testuser',
        password: await bcrypt.hash('testpassword', 10),
      };

      usersRepository.findOne.mockResolvedValue(mockedUser);
      jwtService.sign.mockReturnValue('mockedAccessToken');

      const result = await authService.signIn(mockAuthCredentialsDto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: 'testuser',
      });
      expect(result).toEqual({ accessToken: 'mockedAccessToken' });
    });

    it('should throw UnauthorizedException if invalid credentials are provided', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      expect(authService.signIn(mockAuthCredentialsDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });
  });
});
