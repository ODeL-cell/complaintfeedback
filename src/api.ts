import { Complaint, UserAccount } from './types.ts';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  return response.json();
};

export const fetchComplaints = async (): Promise<Complaint[]> => {
  return handleResponse(await fetch(`${API_BASE}/api/complaints`, { credentials: 'include' }));
};

export const fetchComplaintById = async (id: string): Promise<Complaint> => {
  return handleResponse(await fetch(`${API_BASE}/api/complaints/${encodeURIComponent(id)}`, { credentials: 'include' }));
};

export const createComplaint = async (complaint: Partial<Complaint>): Promise<Complaint> => {
  return handleResponse(await fetch(`${API_BASE}/api/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(complaint),
    credentials: 'include'
  }));
};

export const updateComplaint = async (id: string, complaint: Partial<Complaint>): Promise<Complaint> => {
  return handleResponse(await fetch(`${API_BASE}/api/complaints/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(complaint),
    credentials: 'include'
  }));
};

export const deleteComplaint = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/complaints/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error(await response.text() || response.statusText);
  }
};

export const fetchUsers = async (): Promise<UserAccount[]> => {
  return handleResponse(await fetch(`${API_BASE}/api/users`, { credentials: 'include' }));
};

export const fetchUserByEmail = async (email: string): Promise<UserAccount> => {
  return handleResponse(await fetch(`${API_BASE}/api/users/${encodeURIComponent(email)}`, { credentials: 'include' }));
};

export const createUser = async (user: Partial<UserAccount>): Promise<UserAccount> => {
  return handleResponse(await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
    credentials: 'include'
  }));
};

export const updateUser = async (email: string, user: Partial<UserAccount>): Promise<UserAccount> => {
  return handleResponse(await fetch(`${API_BASE}/api/users/${encodeURIComponent(email)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
    credentials: 'include'
  }));
};

export const deleteUser = async (email: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/users/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error(await response.text() || response.statusText);
  }
};
