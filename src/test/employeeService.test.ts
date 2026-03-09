import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '@/services/employeeService';

describe('Employee Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default chain: from().select().order()
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockEq.mockResolvedValue({ data: null, error: null });

    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: vi.fn().mockReturnValue({ eq: mockEq }),
    });
  });

  describe('fetchEmployees', () => {
    it('should fetch all employees', async () => {
      const mockEmployees = [
        { id: '1', full_name: 'Иванов Иван', position: 'Менеджер' },
        { id: '2', full_name: 'Петрова Мария', position: 'Разработчик' },
      ];

      mockOrder.mockResolvedValue({ data: mockEmployees, error: null });

      const result = await fetchEmployees();

      expect(mockFrom).toHaveBeenCalledWith('employees');
      expect(result.data).toEqual(mockEmployees);
      expect(result.error).toBeNull();
    });

    it('should handle fetch errors', async () => {
      const mockError = { message: 'Network error', code: '500' };
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      const result = await fetchEmployees();

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });
  });

  describe('createEmployee', () => {
    it('should create a new employee', async () => {
      const newEmployee = {
        full_name: 'Новый Сотрудник',
        position: 'Стажёр',
        email: 'new@company.com',
      };

      const mockCreated = { id: 'new-id', ...newEmployee };
      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockCreated, error: null }),
        }),
      });

      const result = await createEmployee(newEmployee);

      expect(mockFrom).toHaveBeenCalledWith('employees');
      expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining(newEmployee)]);
      expect(result.data).toEqual(mockCreated);
    });

    it('should require full_name', async () => {
      const invalidEmployee = { position: 'Тест' };

      const result = await createEmployee(invalidEmployee as any);

      expect(result.error).toBeTruthy();
    });
  });

  describe('updateEmployee', () => {
    it('should update an employee', async () => {
      const updates = { full_name: 'Обновлённое Имя' };
      const employeeId = 'emp-1';

      mockUpdate.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: employeeId, ...updates },
              error: null,
            }),
          }),
        }),
      });

      const result = await updateEmployee(employeeId, updates);

      expect(mockFrom).toHaveBeenCalledWith('employees');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining(updates));
      expect(result.data?.full_name).toBe('Обновлённое Имя');
    });
  });

  describe('deleteEmployee', () => {
    it('should delete an employee', async () => {
      mockEq.mockResolvedValue({ data: null, error: null });

      const result = await deleteEmployee('emp-1');

      expect(mockFrom).toHaveBeenCalledWith('employees');
      expect(result.error).toBeNull();
    });
  });
});
