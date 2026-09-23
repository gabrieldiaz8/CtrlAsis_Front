import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RoleService } from './role.service';

describe('RoleService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('on browser', () => {
    let service: RoleService;

    beforeEach(() => {
      TestBed.configureTestingModule({});
      service = TestBed.inject(RoleService);
    });

    it('starts with null role when there is no user_data', () => {
      expect(service.currentUserRole()).toBeNull();
      expect(service.currentUserId()).toBeNull();
    });

    it('reads a valid role and user id from localStorage on refresh()', () => {
      localStorage.setItem('user_data', JSON.stringify({ id: '7', rol: 'dueno' }));
      service.refresh();
      expect(service.currentUserRole()).toBe('dueno');
      expect(service.currentUserId()).toBe('7');
    });

    it('rejects invalid roles stored in localStorage', () => {
      localStorage.setItem('user_data', JSON.stringify({ id: '7', rol: 'pirata' }));
      service.refresh();
      expect(service.currentUserRole()).toBeNull();
    });

    it('clears the role when stored JSON is malformed', () => {
      localStorage.setItem('user_data', 'not-json{');
      service.refresh();
      expect(service.currentUserRole()).toBeNull();
      expect(service.currentUserId()).toBeNull();
    });

    it('hasRole() only matches the exact current role', () => {
      localStorage.setItem('user_data', JSON.stringify({ id: '1', rol: 'administrador' }));
      service.refresh();
      expect(service.hasRole('administrador')).toBe(true);
      expect(service.hasRole('recepcionista')).toBe(false);
    });

    it('hasAnyRole() returns false when no role is set', () => {
      expect(service.hasAnyRole(['dueno', 'super_admin'])).toBe(false);
    });

    it('hasAnyRole() returns true when the role is included', () => {
      localStorage.setItem('user_data', JSON.stringify({ id: '1', rol: 'super_admin' }));
      service.refresh();
      expect(service.hasAnyRole(['administrador', 'dueno', 'super_admin'])).toBe(true);
    });

    it('canAccessModule() gates sensitive modules by role', () => {
      localStorage.setItem('user_data', JSON.stringify({ id: '1', rol: 'dueno' }));
      service.refresh();
      expect(service.canAccessModule('catalogos')).toBe(true);
      expect(service.canAccessModule('configuracion')).toBe(true);
      expect(service.canAccessModule('usuarios')).toBe(true);
      expect(service.canAccessModule('membresias')).toBe(true);

      localStorage.setItem('user_data', JSON.stringify({ id: '2', rol: 'recepcionista' }));
      service.refresh();
      expect(service.canAccessModule('acceso')).toBe(true);
      expect(service.canAccessModule('dashboard')).toBe(true);
      expect(service.canAccessModule('membresias')).toBe(false);
      expect(service.canAccessModule('catalogos')).toBe(false);
    });

    it('canAccessModule() returns false for unknown modules', () => {
      expect(service.canAccessModule('unknown')).toBe(false);
    });

    it('roleLevel() and roleLabel() map the current role', () => {
      localStorage.setItem('user_data', JSON.stringify({ id: '1', rol: 'super_admin' }));
      service.refresh();
      expect(service.roleLevel()).toBe(4);
      expect(service.roleLabel()).toBe('Super Admin');

      localStorage.removeItem('user_data');
      service.refresh();
      expect(service.roleLevel()).toBe(0);
      expect(service.roleLabel()).toBe('Usuario');
    });
  });

  it('does not read localStorage when running on the server', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }]
    });
    const service = TestBed.inject(RoleService);
    localStorage.setItem('user_data', JSON.stringify({ id: '1', rol: 'dueno' }));
    service.refresh();
    expect(service.currentUserRole()).toBeNull();
  });
});