import { useState, useCallback } from "react";
import { api } from "../../api/axios";

export function usePendingUsers() {
  const [pending, setPending] = useState([]);

  const fetchPending = useCallback(async (role) => {
    try {
      const { data } = await api.get(`/admin/pending`, { params: { role } });
      setPending(data.users || data);
      return data;
    } catch (err) {
      console.error('Failed to fetch pending users', err);
      throw err;
    }
  }, []);

  return { pending, fetchPending };
}
