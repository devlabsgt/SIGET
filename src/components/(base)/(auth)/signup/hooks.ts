"use client";

import { useState, useActionState } from "react";
import { signup } from "./actions";

export function useSignupLogic() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [rol, setRol] = useState("user");
  const [organizacionId, setOrganizacionId] = useState("");

  const [state, formAction, isPending] = useActionState(signup, null);

  return {
    name,
    setName,
    username,
    setUsername,
    passwordValue,
    setPasswordValue,
    rol,
    setRol,
    organizacionId,
    setOrganizacionId,
    showPassword,
    setShowPassword,
    state,
    formAction,
    isPending,
  };
}
