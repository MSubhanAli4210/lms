"use client";

import {
  useEffect,
  useState,
} from "react";

type User = {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  purchasedCourses: string[];
  createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] =
    useState<User[]>([]);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  async function loadUsers() {
    try {
      setLoading(true);

      const response =
        await fetch("/api/users");

      const data =
        await response.json();

      if (response.ok) {
        setUsers(data.users);
      } else {
        setMessage(
          data.message ||
            "Could not load users"
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Could not load users"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function updateRole(
    id: string,
    role: User["role"]
  ) {
    setMessage("");

    const response =
      await fetch(
        `/api/users/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            role,
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      setMessage(
        data.message ||
          "Could not update role"
      );

      return;
    }

    setUsers((current) =>
      current.map((user) =>
        user._id === id
          ? {
              ...user,
              role:
                data.user.role,
            }
          : user
      )
    );

    setMessage(
      "User role updated"
    );
  }

  async function deleteUser(
    user: User
  ) {
    const confirmed =
      window.confirm(
        `Delete ${user.name}? Their course enrollments will also be removed.`
      );

    if (!confirmed) {
      return;
    }

    setMessage("");

    const response =
      await fetch(
        `/api/users/${user._id}`,
        {
          method: "DELETE",
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      setMessage(
        data.message ||
          "Could not delete user"
      );

      return;
    }

    setUsers((current) =>
      current.filter(
        (item) =>
          item._id !==
          user._id
      )
    );

    setMessage(
      "User deleted successfully"
    );
  }

  return (
    <section className="animate-page-enter min-h-screen px-6 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
          Administration
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
          User management
        </h1>

        <p className="mt-3 text-slate-600">
          Review accounts,
          change roles and manage
          workspace access.
        </p>

        {message && (
          <p className="mt-5 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            {message}
          </p>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm shadow-slate-900/5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    User
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Joined
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Courses
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Role
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {users.map(
                  (user) => (
                    <tr
                      key={
                        user._id
                      }
                      className="hover:bg-teal-50/30"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {
                            user.name
                          }
                        </p>

                        <p className="mt-1 text-slate-500">
                          {
                            user.email
                          }
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {new Date(
                          user.createdAt
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {user
                          .purchasedCourses
                          ?.length ||
                          0}
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={
                            user.role
                          }
                          onChange={(
                            event
                          ) =>
                            void updateRole(
                              user._id,
                              event
                                .target
                                .value as User["role"]
                            )
                          }
                          className="rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-700"
                        >
                          <option value="user">
                            Learner
                          </option>

                          <option value="admin">
                            Admin
                          </option>
                        </select>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            void deleteUser(
                              user
                            )
                          }
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {!loading &&
            users.length ===
              0 && (
              <p className="p-8 text-center text-sm text-slate-500">
                No users
                found.
              </p>
            )}

          {loading && (
            <p className="p-8 text-center text-sm text-slate-500">
              Loading users...
            </p>
          )}
        </div>
      </div>
    </section>
  );
}