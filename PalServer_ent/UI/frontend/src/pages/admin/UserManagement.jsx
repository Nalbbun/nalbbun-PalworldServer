import { useEffect, useState } from "react";
import { useLang } from "../../context/LangContext";
import api from "../../utils/api";
import LoadingOverlay from "../../components/LoadingOverlay";

export default function UserManagement() {
  const { t } = useLang();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 신규 등록 폼 상태
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "operator", // default
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get("/auth/users");
      setUsers(res || []);
    } catch (e) {
      console.error(t("msgFailedToLoadUsers"), e);
    }
  };

  const handleDelete = async (username) => {
    if (!window.confirm(`${t("msgConfirmDelete")} : ${username}?`)) return;
    
    setLoading(true);
    try {
      await api.delete(`/auth/delete/${username}`);
      await loadUsers();
    } catch (e) {
      alert(t("msgErrorDeletingUser"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if(!formData.username || !formData.password) return;

    setLoading(true);
    try {
      await api.post("/auth/register", formData);
      setIsModalOpen(false);
      setFormData({ username: "", password: "", role: "operator" }); // 초기화
      await loadUsers();
      alert(t("msgUserCreated"));
    } catch (e) {
      alert(t("msgFailedToCreateUser"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-200 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("tlUserManagement")}</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-sm transition"
        >
          + {t("btnAddUser")}
        </button>
      </div>

      {/* User Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 uppercase text-xs font-bold">
            <tr>
              <th className="p-4">{t("labid")}</th>
              <th className="p-4">{t("labRole")}</th>
              <th className="p-4 text-right">{t("labActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-4 font-medium">{u.username}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    u.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {u.username !== 'admin' && (
                    <button
                      onClick={() => handleDelete(u.username)}
                      className="px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded text-sm font-semibold transition"
                    >
                      {t("btnDelete")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
                <tr><td colSpan="3" className="p-8 text-center text-gray-500">{t("msgNoUsersFound")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4">{t("tlAddUser") || "Add New User"}</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("labid")}</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("labpassword")}</label>
                <input
                  type="password"
                  required
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("labRole")}</label>
                <select
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="operator">{t("labOperator")}</option>
                  <option value="admin">{t("labAdmin")}</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded"
                >
                  {t("btnCancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded"
                >
                  {t("btnCreate")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <LoadingOverlay show={loading} />
    </div>
  );
}