const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

type AuthResponse = {
  token: string;
  user: { id: string; name: string; email: string; role: string };
};

export type Contractor = {
  _id: string;
  nom: string;
  projectCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ContractorInput = {
  nom: string;
};

export type ProjectFile = {
  _id: string;
  name: string;
  originalName: string;
  filename: string;
  url: string;
  size?: number;
  mimetype?: string;
  uploadedAt?: string;
};

export type ProjectImage = {
  _id: string;
  title?: string;
  originalName: string;
  filename: string;
  url: string;
  size?: number;
  mimetype?: string;
  uploadedAt?: string;
};

export type CommentReply = {
  _id: string;
  author: string;
  text: string;
  date?: string;
  createdAt?: string;
};

export type ProjectComment = {
  _id: string;
  author: string;
  text: string;
  date?: string;
  replies?: CommentReply[];
  createdAt?: string;
};

export type ProjectLink = {
  _id: string;
  title: string;
  url: string;
  createdAt?: string;
};

export type Project = {
  _id: string;
  name: string;
  description?: string;
  status: string;
  date: string;
  contractor: Contractor | null;
  priority?: string;
  projectType?: string[] | string;
  idReview?: string;
  updates?: string;
  pmName?: string;
  pmEmails?: string;
  peerReview?: string;
  drafterName?: string;
  drafterEmails?: string;
  submittedDate?: string;
  rfiStatus?: string;
  pmStatus?: string;
  draftingStatus?: string;
  qaAndDeliveryStatus?: string;
  projectSs?: string;
  seTime?: string;
  structEngi?: string;
  files?: ProjectFile[];
  images?: ProjectImage[];
  comments?: ProjectComment[];
  links?: ProjectLink[];
  serviceType?: string;
  statusUpdatedAt?: string;
  statusHistory?: Array<{ status: string; changedAt: string; changedBy: string }>;
  customFields?: Record<string, any>;
  isInvoiced?: boolean;
  invoiceStatus?: "Not Invoiced" | "Invoiced" | "Paid" | "Pending" | string;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceAmount?: number;
  invoiceNotes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectInput = {
  name: string;
  description?: string;
  status: string;
  date: string;
  contractor: string; // contractor id, or "" for none
  priority?: string;
  projectType?: string[] | string;
  idReview?: string;
  updates?: string;
  pmName?: string;
  pmEmails?: string;
  peerReview?: string;
  drafterName?: string;
  drafterEmails?: string;
  submittedDate?: string;
  rfiStatus?: string;
  pmStatus?: string;
  draftingStatus?: string;
  qaAndDeliveryStatus?: string;
  projectSs?: string;
  seTime?: string;
  structEngi?: string;
  serviceType?: string;
  customFields?: Record<string, any>;
  isInvoiced?: boolean;
  invoiceStatus?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceAmount?: number;
  invoiceNotes?: string;
};

async function request<T>(
  path: string,
  options: { method?: string; body?: object; auth?: boolean } = {}
): Promise<T> {
  const { method = "GET", body, auth = false } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = localStorage.getItem("adminToken");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) {
    throw new Error((data && data.message) || "An error occurred");
  }
  return data as T;
}

export function loginAdmin(email: string, password: string) {
  return request<AuthResponse>("/auth/login", { method: "POST", body: { email, password } });
}

export function registerAdmin(name: string, email: string, password: string) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: { name, email, password, role: "admin" },
  });
}

export function getProjects() {
  return request<Project[]>("/projects", { auth: true });
}

export function getProject(id: string) {
  return request<Project>(`/projects/${id}`, { auth: true });
}

export function createProject(data: ProjectInput) {
  return request<Project>("/projects", { method: "POST", body: data, auth: true });
}

export function updateProject(id: string, data: Partial<ProjectInput>) {
  return request<Project>(`/projects/${id}`, { method: "PUT", body: data, auth: true });
}

export function updateProjectInvoice(
  id: string,
  data: {
    isInvoiced?: boolean;
    invoiceStatus?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    invoiceAmount?: number;
    invoiceNotes?: string;
  }
) {
  return request<Project>(`/projects/${id}/invoice`, { method: "PATCH", body: data, auth: true });
}

export function deleteProject(id: string) {
  return request<{ message: string }>(`/projects/${id}`, { method: "DELETE", auth: true });
}

export async function uploadProjectFile(
  projectId: string,
  file: File,
  customName?: string
): Promise<{ message: string; file: ProjectFile; project: Project }> {
  const token = localStorage.getItem("adminToken");
  const formData = new FormData();
  formData.append("file", file);
  if (customName) {
    formData.append("name", customName);
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/projects/${projectId}/files`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Error uploading file");
  }
  return data;
}

export function deleteProjectFile(projectId: string, fileId: string) {
  return request<{ message: string; project: Project }>(
    `/projects/${projectId}/files/${fileId}`,
    { method: "DELETE", auth: true }
  );
}

export async function uploadProjectImage(
  projectId: string,
  imageFile: File,
  title?: string
): Promise<{ message: string; image: ProjectImage; project: Project }> {
  const token = localStorage.getItem("adminToken");
  const formData = new FormData();
  formData.append("image", imageFile);
  if (title) {
    formData.append("title", title);
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/projects/${projectId}/images`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Error uploading image");
  }
  return data;
}

export function deleteProjectImage(projectId: string, imageId: string) {
  return request<{ message: string; project: Project }>(
    `/projects/${projectId}/images/${imageId}`,
    { method: "DELETE", auth: true }
  );
}

// Comments & Replies API
export function addProjectComment(
  projectId: string,
  data: { text: string; author?: string }
) {
  return request<{ message: string; comment: ProjectComment; project: Project }>(
    `/projects/${projectId}/comments`,
    { method: "POST", body: data, auth: true }
  );
}

export function updateProjectComment(
  projectId: string,
  commentId: string,
  data: { text: string }
) {
  return request<{ message: string; comment: ProjectComment; project: Project }>(
    `/projects/${projectId}/comments/${commentId}`,
    { method: "PUT", body: data, auth: true }
  );
}

export function deleteProjectComment(projectId: string, commentId: string) {
  return request<{ message: string; project: Project }>(
    `/projects/${projectId}/comments/${commentId}`,
    { method: "DELETE", auth: true }
  );
}

export function addCommentReply(
  projectId: string,
  commentId: string,
  data: { text: string; author?: string }
) {
  return request<{ message: string; reply: CommentReply; comment: ProjectComment; project: Project }>(
    `/projects/${projectId}/comments/${commentId}/replies`,
    { method: "POST", body: data, auth: true }
  );
}

export function updateCommentReply(
  projectId: string,
  commentId: string,
  replyId: string,
  data: { text: string }
) {
  return request<{ message: string; reply: CommentReply; comment: ProjectComment; project: Project }>(
    `/projects/${projectId}/comments/${commentId}/replies/${replyId}`,
    { method: "PUT", body: data, auth: true }
  );
}

export function deleteCommentReply(
  projectId: string,
  commentId: string,
  replyId: string
) {
  return request<{ message: string; project: Project }>(
    `/projects/${projectId}/comments/${commentId}/replies/${replyId}`,
    { method: "DELETE", auth: true }
  );
}

// Links API
export function addProjectLink(
  projectId: string,
  data: { title: string; url: string }
) {
  return request<{ message: string; link: ProjectLink; project: Project }>(
    `/projects/${projectId}/links`,
    { method: "POST", body: data, auth: true }
  );
}

export function deleteProjectLink(projectId: string, linkId: string) {
  return request<{ message: string; project: Project }>(
    `/projects/${projectId}/links/${linkId}`,
    { method: "DELETE", auth: true }
  );
}

// Download/Export functions
function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function exportProjectsCSV() {
  const token = localStorage.getItem("adminToken");
  const res = await fetch(`${API_URL}/projects/export/csv`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error("Error exporting CSV");
  }
  const blob = await res.blob();
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(blob, `projects_${dateStr}.csv`);
}

export async function exportProjectsPDF() {
  const token = localStorage.getItem("adminToken");
  const res = await fetch(`${API_URL}/projects/export/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error("Error exporting PDF");
  }
  const blob = await res.blob();
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(blob, `projects_${dateStr}.pdf`);
}

export async function exportProjectFilesZip(projectId: string, projectName?: string) {
  const token = localStorage.getItem("adminToken");
  const res = await fetch(`${API_URL}/projects/${projectId}/export/zip`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || "Error exporting files ZIP");
  }
  const blob = await res.blob();
  const safeName = (projectName || "project").replace(/[^a-zA-Z0-9_-]/g, "_");
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(blob, `${safeName}_files_${dateStr}.zip`);
}

export async function exportAllUploadedFilesZip() {
  const token = localStorage.getItem("adminToken");
  const res = await fetch(`${API_URL}/projects/export/zip`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error("Error exporting global ZIP");
  }
  const blob = await res.blob();
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(blob, `all_files_${dateStr}.zip`);
}

export async function downloadProjectFile(projectId: string, fileId: string, fileName?: string) {
  const token = localStorage.getItem("adminToken");
  const res = await fetch(`${API_URL}/projects/${projectId}/files/${fileId}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error("Error downloading file");
  }
  const blob = await res.blob();
  triggerBlobDownload(blob, fileName || "file");
}

export async function downloadProjectImage(projectId: string, imageId: string, fileName?: string) {
  const token = localStorage.getItem("adminToken");
  const res = await fetch(`${API_URL}/projects/${projectId}/images/${imageId}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error("Error downloading image");
  }
  const blob = await res.blob();
  triggerBlobDownload(blob, fileName || "image.png");
}

export function getContractors() {
  return request<Contractor[]>("/contractors", { auth: true });
}

export function createContractor(data: ContractorInput) {
  return request<Contractor>("/contractors", { method: "POST", body: data, auth: true });
}

export function updateContractor(id: string, data: ContractorInput) {
  return request<Contractor>(`/contractors/${id}`, { method: "PUT", body: data, auth: true });
}

export function deleteContractor(id: string) {
  return request<{ message: string }>(`/contractors/${id}`, { method: "DELETE", auth: true });
}

export function getContractorProjects(id: string) {
  return request<Project[]>(`/contractors/${id}/projects`, { auth: true });
}

// Subadmins Management
export type SubadminUser = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "subadmin" | "client";
  createdAt?: string;
};

export type SubadminInput = {
  name: string;
  email: string;
  password: string;
};

export function getMentionableUsers() {
  return request<SubadminUser[]>("/users/mentionable", { auth: true });
}

export function getSubadmins() {
  return request<SubadminUser[]>("/users/subadmins", { auth: true });
}

export function createSubadmin(data: SubadminInput) {
  return request<{ message: string; user: SubadminUser }>("/users/subadmins", {
    method: "POST",
    body: data,
    auth: true,
  });
}

export function updateSubadmin(
  id: string,
  data: { name?: string; email?: string; password?: string; role?: string }
) {
  return request<{ message: string; user: SubadminUser }>(`/users/subadmins/${id}`, {
    method: "PUT",
    body: data,
    auth: true,
  });
}

export function deleteSubadmin(id: string) {
  return request<{ message: string }>(`/users/subadmins/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export interface WorkflowStatus {
  _id: string;
  name: string;
  key: string;
  serviceType: string;
  color: string;
  badgeColor?: string;
  lightBg: string;
  borderColor: string;
  headerBg?: string;
  icon: string;
  emptyText: string;
  yellowThresholdHours: number;
  redThresholdHours: number;
  order: number;
  isActive: boolean;
}

export function getWorkflowStatuses(serviceType = "Plan Set Design") {
  return request<WorkflowStatus[]>(`/workflow-statuses?serviceType=${encodeURIComponent(serviceType)}`, {
    auth: true,
  });
}

export function createWorkflowStatus(data: Partial<WorkflowStatus>) {
  return request<WorkflowStatus>("/workflow-statuses", {
    method: "POST",
    body: data,
    auth: true,
  });
}

export function updateWorkflowStatus(id: string, data: Partial<WorkflowStatus>) {
  return request<WorkflowStatus>(`/workflow-statuses/${id}`, {
    method: "PUT",
    body: data,
    auth: true,
  });
}

export function deleteWorkflowStatus(id: string) {
  return request<{ message: string }>(`/workflow-statuses/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export function reorderWorkflowStatuses(statusIds: string[]) {
  return request<{ message: string }>("/workflow-statuses/reorder", {
    method: "POST",
    body: { statusIds },
    auth: true,
  });
}

export interface FieldLabelItem {
  _id: string;
  key: string;
  defaultLabel: string;
  customLabel?: string;
  category: string;
  description?: string;
}

export interface FieldLabelsResponse {
  items: FieldLabelItem[];
  dictionary: Record<string, string>;
}

export function getFieldLabels() {
  return request<FieldLabelsResponse>("/field-labels", { auth: true });
}

export function updateFieldLabels(updates: Record<string, string>) {
  return request<FieldLabelsResponse>("/field-labels", {
    method: "PUT",
    body: { updates },
    auth: true,
  });
}

export function resetFieldLabels() {
  return request<FieldLabelsResponse>("/field-labels/reset", {
    method: "POST",
    auth: true,
  });
}

export type NotificationType =
  | "create"
  | "update"
  | "delete"
  | "info"
  | "warning"
  | "alert"
  | "mention";

export interface AppNotification {
  id: string;
  _id?: string;
  title: string;
  message: string;
  type: NotificationType;
  projectId?: string | null;
  projectName?: string;
  author?: {
    id?: string | null;
    name?: string;
    email?: string;
    role?: string;
  };
  isRead?: boolean;
  metadata?: any;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export function getNotifications() {
  return request<NotificationsResponse>("/notifications", { auth: true });
}

export function markNotificationAsRead(id: string) {
  return request<AppNotification>(`/notifications/${id}/read`, {
    method: "PUT",
    auth: true,
  });
}

export function markAllNotificationsAsRead() {
  return request<{ message: string }>("/notifications/read-all", {
    method: "PUT",
    auth: true,
  });
}

export function deleteNotification(id: string) {
  return request<{ message: string }>(`/notifications/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export function checkDeadlinesManual() {
  return request<{ success: boolean; alertCount: number; scannedCount: number }>("/notifications/check-deadlines", {
    method: "POST",
    auth: true,
  });
}

export function getNotificationStreamUrl() {
  const token = localStorage.getItem("adminToken") || "";
  return `${API_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
}

export type CustomVariableType = "string" | "number" | "date";

export interface CustomVariable {
  _id: string;
  name: string;
  key: string;
  type: CustomVariableType;
  defaultValue?: any;
  order?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function getCustomVariables() {
  return request<CustomVariable[]>("/custom-variables", { auth: true });
}

export function createCustomVariable(data: { name: string; type: CustomVariableType }) {
  return request<CustomVariable>("/custom-variables", {
    method: "POST",
    body: data,
    auth: true,
  });
}

export function deleteCustomVariable(id: string) {
  return request<{ message: string; id: string }>(`/custom-variables/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export function updateCustomVariable(id: string, data: { name: string; type?: CustomVariableType }) {
  return request<CustomVariable>(`/custom-variables/${id}`, {
    method: "PUT",
    body: data,
    auth: true,
  });
}




