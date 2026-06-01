using BaseCore.Common;
using BaseCore.Common.Auth;
using BaseCore.Entities;
using BaseCore.Repository.Authen;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BaseCore.Services.Authen
{
    public interface IUserService
    {
        Task<User> Authenticate(string username, string password);
        Task<List<User>> GetAll();
        Task<User> GetById(string id);
        Task<User> Create(User user, string password);
        Task Update(User user, string password = null);
        Task Delete(string id);
        Task<(List<User> Users, int TotalCount)> Search(string keyword, int page, int pageSize);
    }

    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;

        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<User> Authenticate(string username, string password)
        {
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
                return null;

            var user = await _userRepository.GetByUsernameAsync(username);

            if (user == null)
                return null;

            var passwordMatches = PasswordHasher.IsHashed(user.Password)
                ? PasswordHasher.Verify(password, user.Password)
                : user.Password == password;

            if (!passwordMatches)
            {
                Console.WriteLine($"Login fail: {username}");
                return null;
            }

            if (!PasswordHasher.IsHashed(user.Password))
            {
                user.Password = PasswordHasher.Hash(password);
                await _userRepository.UpdateAsync(user);
            }

            Console.WriteLine($"Login success: {username}");
            return user;
        }

        public async Task<List<User>> GetAll()
        {
            return await _userRepository.GetAllAsync();
        }

        public async Task<User> GetById(string id)
        {
            return await _userRepository.GetByIdAsync(id);
        }

        public async Task<User> Create(User user, string password)
        {
            user.Password = PasswordHasher.Hash(password);
            user.Salt = null;         // không dùng salt nữa

            user.Created = DateTime.Now;
            user.UpdatedAt = DateTime.Now;
            user.IsActive = true;

            await _userRepository.CreateAsync(user);
            return user;
        }

        public async Task Update(User user, string password = null)
        {
            if (!string.IsNullOrEmpty(password))
            {
                user.Password = PasswordHasher.Hash(password);
                user.Salt = null;
            }

            await _userRepository.UpdateAsync(user);
        }

        public async Task Delete(string id)
        {
            await _userRepository.DeleteAsync(id);
        }

        public async Task<(List<User> Users, int TotalCount)> Search(string keyword, int page, int pageSize)
        {
            return await _userRepository.SearchAsync(keyword, page, pageSize);
        }
    }
}
