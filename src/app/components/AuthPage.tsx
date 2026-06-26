import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Home,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react";
import { useNavigation } from "../context/AppContext";
import { useAdmin } from "../context/AdminContext";

type AuthMode = "login" | "signup";
type SubMode = "form" | "forgot";

const TUNISIAN_GOVERNORATES = [
  "Ariana",
  "Béja",
  "Ben Arous",
  "Bizerte",
  "Gabès",
  "Gafsa",
  "Jendouba",
  "Kairouan",
  "Kasserine",
  "Kébili",
  "Le Kef",
  "Mahdia",
  "La Manouba",
  "Médenine",
  "Monastir",
  "Nabeul",
  "Sfax",
  "Sidi Bouzid",
  "Siliana",
  "Sousse",
  "Tataouine",
  "Tozeur",
  "Tunis",
  "Zaghouan",
];

const CUSTOMER_STATUSES = [
  { value: "parent", label: "Parent d'élève" },
  { value: "student", label: "Élève / Étudiant" },
  { value: "teacher", label: "Enseignant / Éducateur" },
  { value: "other", label: "Autre professionnel" },
];

const AUTH_BENEFITS = [
  {
    icon: Truck,
    title: "Livraison rapide",
    text: "Adresse enregistrée pour commander plus vite.",
  },
  {
    icon: BookOpen,
    title: "Catalogue scolaire",
    text: "Livres, cartables et fournitures au même endroit.",
  },
  {
    icon: ShieldCheck,
    title: "Compte sécurisé",
    text: "Vos informations restent simples à gérer.",
  },
];

function Field({
  children,
  label,
  required = false,
  htmlFor,
}: {
  children: React.ReactNode;
  label: string;
  required?: boolean;
  htmlFor: string;
}) {
  return (
    <div className="auth-field">
      <label htmlFor={htmlFor}>
        {label} {required && <span>*</span>}
      </label>
      {children}
    </div>
  );
}

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin@123';

export function AuthPage() {
  const { navigateTo, loginUser } = useNavigation();
  const { login: adminLogin } = useAdmin();
  const [mode, setMode] = useState<AuthMode>("login");
  const [subMode, setSubMode] = useState<SubMode>("form");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    city: "",
    governorate: "",
    postalCode: "",
    statut: "parent",
    remember: true,
  });

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState(1);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("ecolier_remembered_email");
    if (savedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: savedEmail,
        remember: true,
      }));
    }
  }, []);

  const clearMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    clearMessages();
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", className: "auth-strength-fill is-empty" };

    let score = 0;
    if (pass.length >= 6) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score, label: "Très faible", className: "auth-strength-fill is-weak" };
    if (score === 2) return { score, label: "Moyen", className: "auth-strength-fill is-medium" };
    if (score === 3) return { score, label: "Fort", className: "auth-strength-fill is-strong" };
    return { score, label: "Excellent", className: "auth-strength-fill is-excellent" };
  };

  const validateForm = (): boolean => {
    if (mode === "signup") {
      if (!formData.name.trim()) {
        setErrorMsg("Le nom complet est obligatoire.");
        return false;
      }
      if (!formData.phone.trim()) {
        setErrorMsg("Le numéro de téléphone est obligatoire pour la livraison.");
        return false;
      }
      if (!/^\d{8}$/.test(formData.phone.replace(/\s+/g, ""))) {
        setErrorMsg("Le numéro de téléphone doit contenir exactement 8 chiffres.");
        return false;
      }
      if (!formData.governorate) {
        setErrorMsg("Veuillez sélectionner votre gouvernorat.");
        return false;
      }
      if (!formData.city.trim()) {
        setErrorMsg("La ville ou délégation est obligatoire.");
        return false;
      }
      if (!formData.address.trim()) {
        setErrorMsg("L'adresse exacte de livraison est requise.");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMsg("Les mots de passe ne correspondent pas.");
        return false;
      }
    }

    if (!formData.email.trim()) {
      setErrorMsg("L'adresse e-mail est obligatoire.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrorMsg("Format d'e-mail invalide.");
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrorMsg("Le mot de passe doit comporter au moins 6 caractères.");
      return false;
    }
    return true;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    if (!validateForm()) return;

    setIsLoading(true);

    setTimeout(() => {
      const storedUsers = JSON.parse(localStorage.getItem("ecolier_users") || "[]");

      if (mode === "login") {
        // ── Admin shortcut ──────────────────────────────────────────
        if (
          formData.email.toLowerCase() === ADMIN_EMAIL &&
          formData.password === ADMIN_PASSWORD
        ) {
          const success = adminLogin(ADMIN_EMAIL, ADMIN_PASSWORD);
          if (success) {
            setSuccessMsg("Bienvenue Admin ! Redirection vers le tableau de bord...");
            setTimeout(() => navigateTo("admin"), 1200);
          } else {
            setErrorMsg("Erreur lors de la connexion admin.");
          }
          setIsLoading(false);
          return;
        }
        // ── Regular user ────────────────────────────────────────────
        const user = storedUsers.find(
          (u: any) => u.email.toLowerCase() === formData.email.toLowerCase() && u.password === formData.password,
        );

        if (!user) {
          setErrorMsg("Adresse e-mail ou mot de passe incorrect.");
          setIsLoading(false);
          return;
        }

        if (formData.remember) {
          localStorage.setItem("ecolier_remembered_email", formData.email);
        } else {
          localStorage.removeItem("ecolier_remembered_email");
        }

        loginUser(user);
        setSuccessMsg(`Ravi de vous revoir, ${user.name} ! Connexion réussie...`);
        setTimeout(() => navigateTo("home"), 1200);
        return;
      }

      const emailExists = storedUsers.some(
        (u: any) => u.email.toLowerCase() === formData.email.toLowerCase(),
      );

      if (emailExists) {
        setErrorMsg("Un compte existe déjà avec cette adresse e-mail.");
        setIsLoading(false);
        return;
      }

      const newUser = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        governorate: formData.governorate,
        postalCode: formData.postalCode,
        statut: formData.statut,
      };

      storedUsers.push(newUser);
      localStorage.setItem("ecolier_users", JSON.stringify(storedUsers));
      loginUser(newUser);
      setSuccessMsg("Votre compte client a été créé avec succès !");
      setTimeout(() => navigateTo("home"), 1200);
    }, 800);
  };

  const handleForgotSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();

    if (forgotStep === 1) {
      if (!forgotEmail.trim() || !/\S+@\S+\.\S+/.test(forgotEmail)) {
        setErrorMsg("Veuillez saisir une adresse e-mail valide.");
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        const storedUsers = JSON.parse(localStorage.getItem("ecolier_users") || "[]");
        const userExists = storedUsers.some((u: any) => u.email.toLowerCase() === forgotEmail.toLowerCase());

        if (userExists) {
          setForgotStep(2);
          setSuccessMsg("E-mail vérifié. Vous pouvez définir un nouveau mot de passe.");
        } else {
          setErrorMsg("Aucun compte n'est enregistré avec cette adresse e-mail.");
        }
        setIsLoading(false);
      }, 700);
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const storedUsers = JSON.parse(localStorage.getItem("ecolier_users") || "[]").map((u: any) =>
        u.email.toLowerCase() === forgotEmail.toLowerCase() ? { ...u, password: newPassword } : u,
      );

      localStorage.setItem("ecolier_users", JSON.stringify(storedUsers));
      setSuccessMsg("Votre mot de passe a été modifié avec succès.");
      setTimeout(() => {
        setSubMode("form");
        setMode("login");
        setForgotStep(1);
        setForgotEmail("");
        setNewPassword("");
        setConfirmNewPassword("");
        setFormData((prev) => ({ ...prev, password: "" }));
        setIsLoading(false);
      }, 1200);
    }, 700);
  };

  const strength = getPasswordStrength(formData.password);
  const pageTitle = mode === "login" ? "Connexion" : "Créer un compte";
  const pageText =
    mode === "login"
      ? "Accédez à votre espace client pour retrouver vos informations et commander plus vite."
      : "Quelques informations suffisent pour préparer vos prochaines commandes.";

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <aside className="auth-panel">
          <button type="button" className="auth-back" onClick={() => navigateTo("home")}>
            <ArrowLeft size={16} />
            Retour boutique
          </button>

          <div>
            <p className="auth-kicker">Librairie l'Écolier</p>
            <h1>{subMode === "forgot" ? "Réinitialiser le mot de passe" : pageTitle}</h1>
            <p>{subMode === "forgot" ? "On vérifie votre e-mail, puis vous choisissez un nouveau mot de passe." : pageText}</p>
          </div>

          <div className="auth-benefits" aria-label="Avantages du compte">
            {AUTH_BENEFITS.map(({ icon: Icon, title, text }) => (
              <div className="auth-benefit" key={title}>
                <span>
                  <Icon size={18} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="auth-card">
          {subMode === "forgot" ? (
            <div className="auth-form-wrap">
              <button
                type="button"
                className="auth-inline-link auth-return"
                onClick={() => {
                  setSubMode("form");
                  setForgotStep(1);
                  clearMessages();
                }}
              >
                <ArrowLeft size={15} />
                Retour à la connexion
              </button>

              <div className="auth-heading">
                <span className="auth-heading-icon">
                  <KeyRound size={22} />
                </span>
                <div>
                  <h2>Mot de passe oublié ?</h2>
                  <p>{forgotStep === 1 ? "Saisissez l'e-mail de votre compte." : "Choisissez votre nouveau mot de passe."}</p>
                </div>
              </div>

              {errorMsg && (
                <div className="auth-alert is-error">
                  <AlertCircle size={18} />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="auth-alert is-success">
                  <CheckCircle2 size={18} />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="auth-form">
                {forgotStep === 1 ? (
                  <Field htmlFor="forgotEmail" label="Adresse e-mail" required>
                    <div className="auth-input-wrap">
                      <Mail size={18} />
                      <input
                        id="forgotEmail"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          clearMessages();
                        }}
                        placeholder="nom@exemple.com"
                        required
                      />
                    </div>
                  </Field>
                ) : (
                  <>
                    <Field htmlFor="newPassword" label="Nouveau mot de passe" required>
                      <div className="auth-input-wrap">
                        <Lock size={18} />
                        <input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            clearMessages();
                          }}
                          placeholder="Minimum 6 caractères"
                          required
                        />
                        <button type="button" className="auth-eye" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </Field>

                    <Field htmlFor="confirmNewPassword" label="Confirmer le mot de passe" required>
                      <div className="auth-input-wrap">
                        <Lock size={18} />
                        <input
                          id="confirmNewPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmNewPassword}
                          onChange={(e) => {
                            setConfirmNewPassword(e.target.value);
                            clearMessages();
                          }}
                          placeholder="Répétez le mot de passe"
                          required
                        />
                        <button type="button" className="auth-eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </Field>
                  </>
                )}

                <button type="submit" className="auth-submit" disabled={isLoading}>
                  {isLoading ? <span className="auth-spinner" /> : <>{forgotStep === 1 ? "Vérifier l'e-mail" : "Réinitialiser"} <ArrowRight size={16} /></>}
                </button>
              </form>
            </div>
          ) : (
            <div className="auth-form-wrap">
              <div className="auth-tabs" role="tablist" aria-label="Choisir le mode">
                <button
                  type="button"
                  className={mode === "login" ? "active" : ""}
                  onClick={() => {
                    setMode("login");
                    clearMessages();
                  }}
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  className={mode === "signup" ? "active" : ""}
                  onClick={() => {
                    setMode("signup");
                    clearMessages();
                  }}
                >
                  Créer un compte
                </button>
              </div>

              <div className="auth-heading">
                <div>
                  <h2>{mode === "login" ? "Bon retour" : "Vos informations"}</h2>
                  <p>{mode === "login" ? "Connectez-vous avec votre e-mail." : "Les champs marqués d'un astérisque sont nécessaires."}</p>
                </div>
              </div>

              {errorMsg && (
                <div className="auth-alert is-error">
                  <AlertCircle size={18} />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="auth-alert is-success">
                  <CheckCircle2 size={18} />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                {mode === "signup" && (
                  <Field htmlFor="name" label="Nom complet" required>
                    <div className="auth-input-wrap">
                      <User size={18} />
                      <input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} placeholder="Ex. Mohamed Ali" />
                    </div>
                  </Field>
                )}

                <div className={mode === "signup" ? "auth-grid" : ""}>
                  <Field htmlFor="email" label="Adresse e-mail" required>
                    <div className="auth-input-wrap">
                      <Mail size={18} />
                      <input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="nom@exemple.com" />
                    </div>
                  </Field>

                  {mode === "signup" && (
                    <Field htmlFor="phone" label="Téléphone" required>
                      <div className="auth-input-wrap has-prefix">
                        <Phone size={18} />
                        <span className="auth-prefix">+216</span>
                        <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} maxLength={8} placeholder="55123456" />
                      </div>
                    </Field>
                  )}
                </div>

                <Field htmlFor="password" label="Mot de passe" required>
                  <div className="auth-input-wrap">
                    <Lock size={18} />
                    <input id="password" name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleInputChange} placeholder="Minimum 6 caractères" />
                    <button type="button" className="auth-eye" onClick={() => setShowPassword(!showPassword)} aria-label="Afficher ou masquer le mot de passe">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {mode === "signup" && formData.password && (
                    <div className="auth-strength">
                      <div>
                        <span>Sécurité</span>
                        <strong>{strength.label}</strong>
                      </div>
                      <div className="auth-strength-track">
                        <span className={strength.className} />
                      </div>
                    </div>
                  )}
                </Field>

                {mode === "signup" && (
                  <>
                    <Field htmlFor="confirmPassword" label="Confirmer le mot de passe" required>
                      <div className="auth-input-wrap">
                        <Lock size={18} />
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Répétez le mot de passe"
                        />
                        <button type="button" className="auth-eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label="Afficher ou masquer la confirmation">
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </Field>

                    <div className="auth-section-label">Livraison</div>

                    <div className="auth-grid">
                      <Field htmlFor="governorate" label="Gouvernorat" required>
                        <div className="auth-input-wrap">
                          <MapPin size={18} />
                          <select id="governorate" name="governorate" value={formData.governorate} onChange={handleInputChange}>
                            <option value="">Sélectionner</option>
                            {TUNISIAN_GOVERNORATES.map((gov) => (
                              <option key={gov} value={gov}>
                                {gov}
                              </option>
                            ))}
                          </select>
                        </div>
                      </Field>

                      <Field htmlFor="city" label="Ville / délégation" required>
                        <div className="auth-input-wrap">
                          <Home size={18} />
                          <input id="city" name="city" type="text" value={formData.city} onChange={handleInputChange} placeholder="Ex. L'Aouina" />
                        </div>
                      </Field>
                    </div>

                    <div className="auth-grid is-wide">
                      <Field htmlFor="address" label="Adresse de livraison" required>
                        <input className="auth-plain-input" id="address" name="address" type="text" value={formData.address} onChange={handleInputChange} placeholder="Rue, résidence, appartement..." />
                      </Field>

                      <Field htmlFor="postalCode" label="Code postal">
                        <input className="auth-plain-input" id="postalCode" name="postalCode" type="text" value={formData.postalCode} onChange={handleInputChange} maxLength={4} placeholder="2045" />
                      </Field>
                    </div>

                    <Field htmlFor="statut" label="Vous êtes">
                      <div className="auth-input-wrap">
                        <GraduationCap size={18} />
                        <select id="statut" name="statut" value={formData.statut} onChange={handleInputChange}>
                          {CUSTOMER_STATUSES.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Field>
                  </>
                )}

                {mode === "login" && (
                  <div className="auth-options">
                    <label>
                      <input
                        type="checkbox"
                        name="remember"
                        checked={formData.remember}
                        onChange={(e) => setFormData((prev) => ({ ...prev, remember: e.target.checked }))}
                      />
                      Se souvenir de moi
                    </label>
                    <button
                      type="button"
                      className="auth-inline-link"
                      onClick={() => {
                        setSubMode("forgot");
                        clearMessages();
                      }}
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                )}

                <button type="submit" className="auth-submit" disabled={isLoading}>
                  {isLoading ? <span className="auth-spinner" /> : <>{mode === "login" ? "Se connecter" : "Créer mon compte"} <ArrowRight size={16} /></>}
                </button>
              </form>

              <p className="auth-terms">En continuant, vous acceptez les conditions de vente et la politique de confidentialité.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
