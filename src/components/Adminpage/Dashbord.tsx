import { useState, useEffect, useRef } from "react";
import { FaPlus, FaTrash, FaCheckCircle, FaClock, FaHourglassEnd, FaComment, FaLink, FaFile, FaImage, FaUpload, FaDownload, FaFilePdf, FaFileArchive, FaChevronDown, FaChevronUp, FaReply, FaPaperPlane, FaUserShield, FaCrown, FaSearch, FaTimes, FaEye, FaPencilAlt } from "react-icons/fa";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  uploadProjectFile,
  deleteProjectFile,
  uploadProjectImage,
  deleteProjectImage,
  downloadProjectFile,
  downloadProjectImage,
  addProjectComment,
  deleteProjectComment,
  addCommentReply,
  deleteCommentReply,
  addProjectLink,
  deleteProjectLink,
  exportProjectFilesZip,
  exportAllUploadedFilesZip,
  exportProjectsCSV,
  exportProjectsPDF,
  getContractors,
  type Contractor,
} from "../../lib/api";
import Contractors from "./Contractors";
import Subadmins from "./Subadmins";
import "./admin-responsive.css";

type ProjectDetail = {
  id: string;
  name: string;
  description: string;
  status: string;
  date: string;
  contractor: Contractor | null;
  comments: Comment[];
  links: Link[];
  files: FileItem[];
  images: ImageItem[];
};

type CommentReply = {
  id: string | number;
  text: string;
  author: string;
  date: string;
};

type Comment = {
  id: string | number;
  text: string;
  author: string;
  date: string;
  replies: CommentReply[];
};

type Link = {
  id: string | number;
  title: string;
  url: string;
};

type FileItem = {
  id: string | number;
  name: string;
  url: string;
  size?: number;
};

type ImageItem = {
  id: string | number;
  url: string;
  title: string;
  size?: number;
};

type DashboardProps = {
  user: { id?: string; name: string; email: string; role?: string } | null;
  onLogout: () => void;
};

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeView, setActiveView] = useState<"projects" | "contractors" | "subadmins">("projects");
  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contractorsList, setContractorsList] = useState<Contractor[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [newLink, setNewLink] = useState({ title: "", url: "" });
  const [newFile, setNewFile] = useState({ name: "", url: "" });
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newImage, setNewImage] = useState({ url: "", title: "" });
  const [selectedImageObj, setSelectedImageObj] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "links" | "files" | "images">("comments");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "En attente",
    date: "",
    contractor: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [groupPages, setGroupPages] = useState<Record<string, number>>({});
  const [sortField, setSortField] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getGroupPage = (key: string) => groupPages[key] || 1;
  const setGroupPage = (key: string, page: number) => {
    setGroupPages((prev) => ({ ...prev, [key]: page }));
  };

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const GROUPS = [
    {
      key: "En cours",
      title: "In Progress Projects",
      color: "#2563eb",
      badgeColor: "#3b82f6",
      lightBg: "#eff6ff",
      borderColor: "#bfdbfe",
      headerBg: "#f0f7ff",
      icon: "🔵",
      emptyText: "No projects in progress",
    },
    {
      key: "En attente",
      title: "Pending Projects",
      color: "#d97706",
      badgeColor: "#f59e0b",
      lightBg: "#fffbeb",
      borderColor: "#fde68a",
      headerBg: "#fffdf0",
      icon: "🟡",
      emptyText: "No pending projects",
    },
    {
      key: "Complété",
      title: "Completed Projects",
      color: "#059669",
      badgeColor: "#10b981",
      lightBg: "#ecfdf5",
      borderColor: "#a7f3d0",
      headerBg: "#f0fdf4",
      icon: "🟢",
      emptyText: "No completed projects",
    },
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "En cours":
        return "In Progress";
      case "Complété":
        return "Completed";
      case "En attente":
      default:
        return "Pending";
    }
  };

  const mapProjectComments = (p: any): Comment[] => {
    return (p.comments || []).map((c: any) => ({
      id: c._id || c.id || Date.now(),
      text: c.text,
      author: c.author || "Admin",
      date: c.date || (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : new Date().toLocaleDateString()),
      replies: (c.replies || []).map((r: any) => ({
        id: r._id || r.id || Date.now(),
        text: r.text,
        author: r.author || "Admin",
        date: r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : new Date().toLocaleDateString()),
      })),
    }));
  };

  const mapProjectLinks = (p: any): Link[] => {
    return (p.links || []).map((l: any) => ({
      id: l._id || l.id || Date.now(),
      title: l.title,
      url: l.url,
    }));
  };

  const mapProjectToFileItems = (p: any): FileItem[] => {
    return (p.files || []).map((f: any) => ({
      id: f._id || f.id || Date.now(),
      name: f.name || f.originalName || "File",
      url: typeof f.url === "string" && f.url.startsWith("http") ? f.url : `http://localhost:5000${f.url || ""}`,
      size: f.size,
    }));
  };

  const mapProjectToImageItems = (p: any): ImageItem[] => {
    return (p.images || []).map((img: any) => ({
      id: img._id || img.id || Date.now(),
      title: img.title || img.originalName || "Image",
      url: typeof img.url === "string" && img.url.startsWith("http") ? img.url : `http://localhost:5000${img.url || ""}`,
      size: img.size,
    }));
  };

  useEffect(() => {
    getProjects()
      .then((data) =>
        setProjects(
          data.map((p) => ({
            ...p,
            id: p._id,
            comments: mapProjectComments(p),
            links: mapProjectLinks(p),
            files: mapProjectToFileItems(p),
            images: mapProjectToImageItems(p),
          }))
        )
      )
      .catch((err) => alert(err.message))
      .finally(() => setIsLoading(false));

    getContractors()
      .then(setContractorsList)
      .catch((err) => alert(err.message));
  }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.date) {
      alert("Please fill in all fields!");
      return;
    }

    try {
      if (editingId) {
        const updated = await updateProject(editingId, formData);
        setProjects(
          projects.map((p) =>
            p.id === editingId
              ? {
                  ...p,
                  ...updated,
                  id: updated._id,
                  comments: mapProjectComments(updated),
                  links: mapProjectLinks(updated),
                  files: mapProjectToFileItems(updated),
                  images: mapProjectToImageItems(updated),
                }
              : p
          )
        );
      } else {
        const created = await createProject(formData);
        setProjects([
          {
            ...created,
            id: created._id,
            comments: mapProjectComments(created),
            links: mapProjectLinks(created),
            files: mapProjectToFileItems(created),
            images: mapProjectToImageItems(created),
          },
          ...projects,
        ]);
      }
      resetForm();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (project: ProjectDetail) => {
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      date: project.date,
      contractor: project.contractor?._id || "",
    });
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateContractor = async (project: ProjectDetail, contractorId: string) => {
    try {
      const updated = await updateProject(project.id, {
        name: project.name,
        description: project.description,
        status: project.status,
        date: project.date,
        contractor: contractorId,
      });
      setProjects(
        projects.map((p) =>
          p.id === project.id
            ? {
                ...p,
                ...updated,
                id: updated._id,
                comments: mapProjectComments(updated),
                links: mapProjectLinks(updated),
                files: mapProjectToFileItems(updated),
                images: mapProjectToImageItems(updated),
              }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateStatus = async (project: ProjectDetail, newStatus: string) => {
    try {
      const updated = await updateProject(project.id, {
        name: project.name,
        description: project.description,
        status: newStatus,
        date: project.date,
        contractor: project.contractor?._id || "",
      });
      setProjects(
        projects.map((p) =>
          p.id === project.id
            ? {
                ...p,
                ...updated,
                id: updated._id,
                status: newStatus,
                comments: mapProjectComments(updated),
                links: mapProjectLinks(updated),
                files: mapProjectToFileItems(updated),
                images: mapProjectToImageItems(updated),
              }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message || "Error updating status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "En attente",
      date: "",
      contractor: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleAddComment = async (projectId: string) => {
    if (!newComment.trim()) return;
    try {
      const author = user?.name || "Admin";
      const res = await addProjectComment(projectId, { text: newComment.trim(), author });
      setProjects(
        projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                comments: mapProjectComments(res.project),
              }
            : p
        )
      );
      setNewComment("");
    } catch (err: any) {
      alert(err.message || "Error adding comment");
    }
  };

  const handleDeleteComment = async (projectId: string, commentId: string | number) => {
    try {
      if (typeof commentId === "string" && commentId.length === 24) {
        const res = await deleteProjectComment(projectId, commentId);
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, comments: mapProjectComments(res.project) }
              : p
          )
        );
      } else {
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
              : p
          )
        );
      }
    } catch (err: any) {
      alert(err.message || "Error deleting comment");
    }
  };

  const handleAddReply = async (projectId: string, commentId: string | number) => {
    if (!replyText.trim()) return;
    try {
      const author = user?.name || "Admin";
      if (typeof commentId === "string" && commentId.length === 24) {
        const res = await addCommentReply(projectId, commentId, { text: replyText.trim(), author });
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, comments: mapProjectComments(res.project) }
              : p
          )
        );
      } else {
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  comments: p.comments.map((c) =>
                    c.id === commentId
                      ? {
                          ...c,
                          replies: [
                            ...c.replies,
                            {
                              id: Date.now(),
                              text: replyText.trim(),
                              author,
                              date: new Date().toLocaleDateString(),
                            },
                          ],
                        }
                      : c
                  ),
                }
              : p
          )
        );
      }
      setReplyText("");
      setReplyingToCommentId(null);
    } catch (err: any) {
      alert(err.message || "Error adding reply");
    }
  };

  const handleDeleteReply = async (projectId: string, commentId: string | number, replyId: string | number) => {
    try {
      if (typeof commentId === "string" && typeof replyId === "string" && commentId.length === 24 && replyId.length === 24) {
        const res = await deleteCommentReply(projectId, commentId, replyId);
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, comments: mapProjectComments(res.project) }
              : p
          )
        );
      } else {
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  comments: p.comments.map((c) =>
                    c.id === commentId
                      ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) }
                      : c
                  ),
                }
              : p
          )
        );
      }
    } catch (err: any) {
      alert(err.message || "Error deleting reply");
    }
  };

  const handleAddLink = async (projectId: string) => {
    if (!newLink.title || !newLink.url) return;
    try {
      const res = await addProjectLink(projectId, { title: newLink.title, url: newLink.url });
      setProjects(
        projects.map((p) =>
          p.id === projectId
            ? { ...p, links: mapProjectLinks(res.project) }
            : p
        )
      );
      setNewLink({ title: "", url: "" });
    } catch (err: any) {
      alert(err.message || "Error adding link");
    }
  };

  const handleDeleteLink = async (projectId: string, linkId: string | number) => {
    try {
      if (typeof linkId === "string" && linkId.length === 24) {
        const res = await deleteProjectLink(projectId, linkId);
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, links: mapProjectLinks(res.project) }
              : p
          )
        );
      } else {
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, links: p.links.filter((l) => l.id !== linkId) }
              : p
          )
        );
      }
    } catch (err: any) {
      alert(err.message || "Error deleting link");
    }
  };

  const handleAddFile = async (projectId: string) => {
    if (selectedFileObj) {
      setIsUploading(true);
      try {
        const res = await uploadProjectFile(
          projectId,
          selectedFileObj,
          newFile.name.trim() || undefined
        );
        const uploadedFileItem: FileItem = {
          id: res.file._id,
          name: res.file.name || res.file.originalName,
          url: res.file.url.startsWith("http")
            ? res.file.url
            : `http://localhost:5000${res.file.url}`,
          size: res.file.size,
        };
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, files: [...p.files, uploadedFileItem] }
              : p
          )
        );
        setSelectedFileObj(null);
        setNewFile({ name: "", url: "" });
      } catch (err: any) {
        alert(err.message || "Error uploading file");
      } finally {
        setIsUploading(false);
      }
      return;
    }

    if (!newFile.name || !newFile.url) {
      alert("Please select a file to upload or enter a URL.");
      return;
    }
    setProjects(
      projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              files: [
                ...p.files,
                { id: Date.now(), name: newFile.name, url: newFile.url },
              ],
            }
          : p
      )
    );
    setNewFile({ name: "", url: "" });
  };

  const handleAddImage = async (projectId: string) => {
    if (selectedImageObj) {
      setIsUploadingImage(true);
      try {
        const res = await uploadProjectImage(
          projectId,
          selectedImageObj,
          newImage.title.trim() || undefined
        );
        const uploadedImageItem: ImageItem = {
          id: res.image._id,
          title: res.image.title || res.image.originalName,
          url: res.image.url.startsWith("http")
            ? res.image.url
            : `http://localhost:5000${res.image.url}`,
          size: res.image.size,
        };
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, images: [...p.images, uploadedImageItem] }
              : p
          )
        );
        setSelectedImageObj(null);
        setNewImage({ url: "", title: "" });
      } catch (err: any) {
        alert(err.message || "Error uploading image");
      } finally {
        setIsUploadingImage(false);
      }
      return;
    }

    if (!newImage.url) {
      alert("Please select an image to upload or enter a URL.");
      return;
    }
    setProjects(
      projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              images: [
                ...p.images,
                { id: Date.now(), url: newImage.url, title: newImage.title },
              ],
            }
          : p
      )
    );
    setNewImage({ url: "", title: "" });
  };

  const handleDeleteFile = async (projectId: string, fileId: string | number) => {
    try {
      if (typeof fileId === "string" && fileId.length === 24) {
        await deleteProjectFile(projectId, fileId);
      }
      setProjects(
        projects.map((p) =>
          p.id === projectId
            ? { ...p, files: p.files.filter((f) => f.id !== fileId) }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message || "Error deleting file");
    }
  };

  const handleDeleteImage = async (projectId: string, imageId: string | number) => {
    try {
      if (typeof imageId === "string") {
        await deleteProjectImage(projectId, imageId);
      }
      setProjects(
        projects.map((p) =>
          p.id === projectId
            ? { ...p, images: p.images.filter((i) => i.id !== imageId) }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message || "Error deleting image");
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportProjectsCSV();
    } catch (err: any) {
      alert(err.message || "Error exporting CSV");
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportProjectsPDF();
    } catch (err: any) {
      alert(err.message || "Error exporting PDF");
    }
  };

  const handleExportAllUploadedFilesZip = async () => {
    try {
      await exportAllUploadedFilesZip();
    } catch (err: any) {
      alert(err.message || "Error exporting ZIP");
    }
  };

  const handleExportProjectFilesZip = async (projectId: string, projectName: string) => {
    try {
      await exportProjectFilesZip(projectId, projectName);
    } catch (err: any) {
      alert(err.message || "Error exporting project ZIP");
    }
  };

  const handleDownloadFile = async (projectId: string, fileId: string | number, fileName: string) => {
    try {
      if (typeof fileId === "string" && fileId.length === 24) {
        await downloadProjectFile(projectId, fileId, fileName);
      } else {
        const file = selectedProject?.files.find((f) => f.id === fileId);
        if (file?.url) {
          const res = await fetch(file.url);
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        }
      }
    } catch (err: any) {
      alert(err.message || "Error downloading file");
    }
  };

  const handleDownloadImage = async (projectId: string, imageId: string | number, imageName: string) => {
    try {
      if (typeof imageId === "string" && imageId.length === 24) {
        await downloadProjectImage(projectId, imageId, imageName);
      } else {
        const img = selectedProject?.images.find((i) => i.id === imageId);
        if (img?.url) {
          const res = await fetch(img.url);
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = imageName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        }
      }
    } catch (err: any) {
      alert(err.message || "Error downloading image");
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase().trim();
    const nameMatch = (p.name || "").toLowerCase().includes(query);
    const descMatch = (p.description || "").toLowerCase().includes(query);
    const contractorMatch = (p.contractor?.nom || "").toLowerCase().includes(query);
    const dateMatch = (p.date || "").toLowerCase().includes(query);
    const statusMatch = (p.status || "").toLowerCase().includes(query);
    const filesMatch = (p.files || []).some((f) => (f.name || "").toLowerCase().includes(query));
    return nameMatch || descMatch || contractorMatch || dateMatch || statusMatch || filesMatch;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let comp = 0;
    if (sortField === "name") {
      comp = (a.name || "").localeCompare(b.name || "");
    } else if (sortField === "date") {
      comp = new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
    } else if (sortField === "contractor") {
      const nomA = a.contractor?.nom || "";
      const nomB = b.contractor?.nom || "";
      comp = nomA.localeCompare(nomB);
    } else if (sortField === "status") {
      comp = (a.status || "").localeCompare(b.status || "");
    } else if (sortField === "comments") {
      comp = (a.comments?.length || 0) - (b.comments?.length || 0);
    } else if (sortField === "files") {
      comp = ((a.files?.length || 0) + (a.images?.length || 0)) - ((b.files?.length || 0) + (b.images?.length || 0));
    }
    return sortOrder === "asc" ? comp : -comp;
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const totalProjects = projects.length;
  const inProgress = projects.filter((p) => p.status === "En cours").length;
  const completed = projects.filter((p) => p.status === "Complété").length;
  const pending = projects.filter((p) => p.status === "En attente").length;

  return (
    <div className="admin-container">
      {/* HEADER SECTION */}
      <div className="admin-header-card">
        <div className="admin-header-content">
          <div>
            <h1 className="admin-main-title">
              {activeView === "projects"
                ? "Projects Management"
                : activeView === "contractors"
                ? "Contractors Management"
                : "Sub-Administrators Management"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px", flexWrap: "wrap" }}>
              <p className="admin-subtitle" style={{ margin: 0 }}>
                Welcome, <strong>{user?.name}</strong>!
              </p>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "3px 10px",
                  borderRadius: "14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  background: user?.role === "admin" ? "#fef3c7" : "#e0f2fe",
                  color: user?.role === "admin" ? "#b45309" : "#0284c7",
                  border: `1px solid ${user?.role === "admin" ? "#fde68a" : "#bfdbfe"}`,
                }}
              >
                {user?.role === "admin" ? <FaCrown style={{ fontSize: "11px" }} /> : <FaUserShield style={{ fontSize: "11px" }} />}
                {user?.role === "admin" ? "Super Admin" : "Sub-Admin"}
              </span>
            </div>
          </div>
          <div className="admin-header-actions">
            <div className="admin-view-switch">
              <button
                className={`admin-view-switch-btn ${activeView === "projects" ? "active" : ""}`}
                onClick={() => setActiveView("projects")}
              >
                Projects
              </button>
              <button
                className={`admin-view-switch-btn ${activeView === "contractors" ? "active" : ""}`}
                onClick={() => setActiveView("contractors")}
              >
                Contractors
              </button>
              {user?.role === "admin" && (
                <button
                  className={`admin-view-switch-btn ${activeView === "subadmins" ? "active" : ""}`}
                  onClick={() => setActiveView("subadmins")}
                >
                  <FaUserShield style={{ marginRight: "4px" }} /> Sub-Admins
                </button>
              )}
            </div>
            {activeView === "projects" && (
              <button className="admin-btn-primary" onClick={() => setShowForm(true)}>
                <FaPlus /> Add Project
              </button>
            )}
            <button className="admin-btn-outline" onClick={onLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {activeView === "contractors" ? (
        <Contractors />
      ) : activeView === "subadmins" && user?.role === "admin" ? (
        <Subadmins currentUser={user} />
      ) : (
        <>
      {/* STATS SECTION */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: "rgba(255, 110, 0, 0.1)", color: "#ff6e00" }}>
            📊
          </div>
          <h3 className="admin-stat-title">Total</h3>
          <p className="admin-stat-value">{totalProjects}</p>
          <p className="admin-stat-desc">Total projects</p>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
            <FaClock style={{ color: "#3b82f6" }} />
          </div>
          <h3 className="admin-stat-title">In Progress</h3>
          <p className="admin-stat-value" style={{ color: "#3b82f6" }}>{inProgress}</p>
          <p className="admin-stat-desc">Currently active</p>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
            <FaCheckCircle style={{ color: "#10b981" }} />
          </div>
          <h3 className="admin-stat-title">Completed</h3>
          <p className="admin-stat-value" style={{ color: "#10b981" }}>{completed}</p>
          <p className="admin-stat-desc">Finished projects</p>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
            <FaHourglassEnd style={{ color: "#f59e0b" }} />
          </div>
          <h3 className="admin-stat-title">Pending</h3>
          <p className="admin-stat-value" style={{ color: "#f59e0b" }}>{pending}</p>
          <p className="admin-stat-desc">To be started</p>
        </div>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div style={styles.formHeader}>
              <h3 style={styles.formTitle}>
                {editingId ? "✏️ Edit Project" : "➕ New Project"}
              </h3>
              <button style={styles.closeBtn} onClick={resetForm}>✕</button>
            </div>

            <input
              type="text"
              placeholder="Project name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={styles.input}
            />

            <textarea
              placeholder="Detailed description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={styles.textarea}
              rows={4}
            />

            <select
              value={formData.contractor}
              onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
              style={styles.input}
            >
              <option value="">Select a contractor</option>
              {contractorsList.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.nom}
                </option>
              ))}
            </select>

            <div className="admin-form-row">
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={styles.input}
              >
                <option value="En attente">Pending</option>
                <option value="En cours">In Progress</option>
                <option value="Complété">Completed</option>
              </select>

              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                style={styles.input}
              />
            </div>

            <div className="admin-form-actions">
              <button style={styles.saveBtn} onClick={handleSave}>
                {editingId ? "Update" : "Create Project"}
              </button>
              <button style={styles.cancelBtn} onClick={resetForm}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE + DETAILS PANEL */}
      <div className="admin-main-layout">
        <div className="admin-projects-section">
          {/* MODERN TOOLBAR: EXPORTS & SEARCH BAR */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              padding: "12px 16px",
              background: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            {/* EXPORT BUTTONS */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginRight: "4px" }}>
                Export:
              </span>
              <button
                style={{
                  background: "#f0fdf4",
                  color: "#16a34a",
                  border: "1px solid #bbf7d0",
                  padding: "6px 13px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 2px rgba(22, 163, 74, 0.05)",
                }}
                onClick={handleExportCSV}
                title="Export projects to CSV"
              >
                <FaDownload style={{ fontSize: "11px" }} /> CSV
              </button>
              <button
                style={{
                  background: "#fef2f2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  padding: "6px 13px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 2px rgba(220, 38, 38, 0.05)",
                }}
                onClick={handleExportPDF}
                title="Export projects to PDF"
              >
                <FaFilePdf style={{ fontSize: "11px" }} /> PDF
              </button>
              <button
                style={{
                  background: "#f5f3ff",
                  color: "#7c3aed",
                  border: "1px solid #ddd6fe",
                  padding: "6px 13px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 2px rgba(124, 58, 237, 0.05)",
                }}
                onClick={handleExportAllUploadedFilesZip}
                title="Download all attached files (ZIP)"
              >
                <FaFileArchive style={{ fontSize: "11px" }} /> ZIP
              </button>
            </div>

            {/* SLEEK & MODERN SEARCH BAR */}
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                background: isSearchFocused ? "#ffffff" : "#f8fafc",
                border: isSearchFocused ? "1.5px solid #ff6e00" : "1.5px solid #e2e8f0",
                borderRadius: "12px",
                padding: "6px 12px 6px 10px",
                width: "100%",
                maxWidth: "420px",
                minWidth: "260px",
                boxShadow: isSearchFocused
                  ? "0 0 0 4px rgba(255, 110, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.05)"
                  : "0 1px 3px rgba(0, 0, 0, 0.02)",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                gap: "8px",
              }}
            >
              {/* SEARCH ICON BADGE */}
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "7px",
                  background: isSearchFocused ? "#fff7ed" : "#edf2f7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isSearchFocused ? "#ea580c" : "#64748b",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                }}
              >
                <FaSearch style={{ fontSize: "11px" }} />
              </div>

              {/* INPUT */}
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by project, contractor, date..."
                value={searchTerm}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  fontSize: "13px",
                  color: "#0f172a",
                  fontWeight: 500,
                  background: "transparent",
                  fontFamily: "inherit",
                }}
              />

              {/* RIGHT SIDE (BADGE OR SHORTCUT) */}
              {searchTerm ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <span
                    style={{
                      background: "#ffedd5",
                      color: "#9a3412",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: "6px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sortedProjects.length}
                  </span>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      searchInputRef.current?.focus();
                    }}
                    style={{
                      background: "#e2e8f0",
                      border: "none",
                      color: "#475569",
                      cursor: "pointer",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "9px",
                      padding: 0,
                      transition: "all 0.15s ease",
                    }}
                    title="Clear search"
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <kbd
                  onClick={() => searchInputRef.current?.focus()}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "5px",
                    padding: "2px 6px",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    fontFamily: "monospace",
                    cursor: "pointer",
                    userSelect: "none",
                    flexShrink: 0,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  }}
                  title="Keyboard shortcut"
                >
                  Ctrl K
                </kbd>
              )}
            </div>
          </div>

          {/* TABLES FILTER TABS */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={() => setFilterGroup("all")}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: "1px solid",
                borderColor: filterGroup === "all" ? "#0f172a" : "#e2e8f0",
                background: filterGroup === "all" ? "#0f172a" : "#fff",
                color: filterGroup === "all" ? "#fff" : "#475569",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: filterGroup === "all" ? "0 2px 6px rgba(15,23,42,0.15)" : "none",
              }}
            >
              <span>All boards</span>
              <span
                style={{
                  background: filterGroup === "all" ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                  padding: "2px 7px",
                  borderRadius: "10px",
                  fontSize: "11px",
                }}
              >
                {sortedProjects.length}
              </span>
            </button>

            {GROUPS.map((grp) => {
              const count = sortedProjects.filter((p) => p.status === grp.key).length;
              const isSelected = filterGroup === grp.key;
              return (
                <button
                  key={grp.key}
                  onClick={() => setFilterGroup(grp.key)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    border: `1px solid ${isSelected ? grp.color : "#e2e8f0"}`,
                    background: isSelected ? grp.color : "#fff",
                    color: isSelected ? "#fff" : "#475569",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: isSelected ? `0 2px 6px ${grp.color}40` : "none",
                  }}
                >
                  <span>{grp.icon} {grp.title}</span>
                  <span
                    style={{
                      background: isSelected ? "rgba(255,255,255,0.25)" : grp.lightBg,
                      color: isSelected ? "#fff" : grp.color,
                      padding: "2px 7px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {searchTerm && (
              <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "6px" }}>
                Results for “<strong>{searchTerm}</strong>” ({sortedProjects.length})
              </span>
            )}
          </div>

          {isLoading ? (
            <div style={styles.empty}>
              <p style={styles.emptyText}>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyIcon}>📭</p>
              <p style={styles.emptyText}>No projects yet</p>
            </div>
          ) : sortedProjects.length === 0 && searchTerm ? (
            <div style={styles.empty}>
              <p style={styles.emptyIcon}>🔍</p>
              <p style={styles.emptyText}>
                No projects match your search “<strong>{searchTerm}</strong>”
              </p>
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  background: "#ff6e00",
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  marginTop: "6px",
                }}
              >
                Reset search
              </button>
            </div>
          ) : (
            <div>
              {GROUPS.filter((grp) => filterGroup === "all" || filterGroup === grp.key).map((grp) => {
                const groupProjects = sortedProjects.filter((p) => p.status === grp.key);
                const isCollapsed = !!collapsedGroups[grp.key];
                const totalCount = groupProjects.length;
                const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;
                const currentPage = getGroupPage(grp.key);
                const safePage = Math.min(Math.max(1, currentPage), totalPages);
                const paginatedProjects = totalCount > ITEMS_PER_PAGE
                  ? groupProjects.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)
                  : groupProjects;

                const startItem = totalCount === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1;
                const endItem = Math.min(safePage * ITEMS_PER_PAGE, totalCount);

                return (
                  <div
                    key={grp.key}
                    style={{
                      marginBottom: "24px",
                      background: "#ffffff",
                      borderRadius: "8px",
                      border: `1px solid ${grp.borderColor}`,
                      overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    {/* GROUP TABLE HEADER */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 18px",
                        background: grp.headerBg,
                        borderBottom: isCollapsed ? "none" : `1px solid ${grp.borderColor}`,
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                      onClick={() => toggleGroupCollapse(grp.key)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "16px" }}>{grp.icon}</span>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: grp.color }}>
                          {grp.title}
                        </span>
                        <span
                          style={{
                            background: grp.color,
                            color: "#fff",
                            padding: "2px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          {groupProjects.length}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({
                              name: "",
                              description: "",
                              status: grp.key,
                              date: new Date().toISOString().slice(0, 10),
                              contractor: "",
                            });
                            setEditingId(null);
                            setShowForm(true);
                          }}
                          style={{
                            background: "#fff",
                            color: grp.color,
                            border: `1px solid ${grp.borderColor}`,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title={`Add a project with status ${getStatusLabel(grp.key)}`}
                        >
                          <FaPlus style={{ fontSize: "10px" }} /> New
                        </button>
                        <button
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "#64748b",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                        </button>
                      </div>
                    </div>

                    {/* GROUP TABLE */}
                    {!isCollapsed && (
                      <div>
                        {groupProjects.length === 0 ? (
                          <div
                            style={{
                              padding: "22px",
                              textAlign: "center",
                              color: "#94a3b8",
                              fontSize: "13px",
                              background: "#fafafa",
                            }}
                          >
                            <p style={{ margin: "0 0 10px 0" }}>{grp.emptyText}</p>
                            <button
                              onClick={() => {
                                setFormData({
                                  name: "",
                                  description: "",
                                  status: grp.key,
                                  date: new Date().toISOString().slice(0, 10),
                                  contractor: "",
                                });
                                setEditingId(null);
                                setShowForm(true);
                              }}
                              style={{
                                background: grp.lightBg,
                                color: grp.color,
                                border: `1px dashed ${grp.borderColor}`,
                                padding: "6px 14px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              + Add project in "{grp.title}"
                            </button>
                          </div>
                        ) : (
                          <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                              <thead>
                                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                  {/* TITLE COLUMN */}
                                  <th
                                    style={{
                                      ...styles.th,
                                      cursor: "pointer",
                                      userSelect: "none",
                                    }}
                                    onClick={() => handleSort("name")}
                                  >
                                    <span
                                      style={{
                                        background: sortField === "name" ? "#e2e8f0" : "#f1f5f9",
                                        padding: "4px 10px",
                                        borderRadius: "4px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        color: sortField === "name" ? "#0f172a" : "#475569",
                                        fontWeight: 700,
                                        fontSize: "12px",
                                        textTransform: "uppercase",
                                        boxShadow: sortField === "name" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                                      }}
                                    >
                                      TITLE {sortField === "name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                                    </span>
                                  </th>

                                  {/* CONTRACTOR */}
                                  <th
                                    style={{
                                      ...styles.th,
                                      cursor: "pointer",
                                      userSelect: "none",
                                    }}
                                    onClick={() => handleSort("contractor")}
                                  >
                                    <span style={{ fontWeight: 700, color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>
                                      CONTRACTOR {sortField === "contractor" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                                    </span>
                                  </th>

                                  {/* STATUS */}
                                  <th style={styles.th}>
                                    <span style={{ fontWeight: 700, color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>
                                      STATUS
                                    </span>
                                  </th>

                                  {/* COMMENTABLE */}
                                  <th style={styles.thCenter}>
                                    <span style={{ fontWeight: 700, color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>
                                      COMMENTABLE
                                    </span>
                                  </th>

                                  {/* ACTIONS */}
                                  <th style={{ ...styles.th, textAlign: "right" }}>
                                    <span style={{ fontWeight: 700, color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>
                                      ACTIONS
                                    </span>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedProjects.map((project) => {
                                  const hasComments = project.comments && project.comments.length > 0;

                                  return (
                                    <tr
                                      key={project.id}
                                      style={{
                                        ...styles.tr,
                                        ...(showDetails && selectedProjectId === project.id ? styles.trActive : {}),
                                      }}
                                      onClick={() => {
                                        setSelectedProjectId(project.id);
                                        setShowDetails(true);
                                        setActiveTab("comments");
                                      }}
                                    >
                                      {/* TITLE */}
                                      <td style={{ ...styles.td, ...styles.tdAccent }}>
                                        <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "13.5px" }}>
                                          {project.name}
                                        </div>
                                        <div style={{ color: "#64748b", fontSize: "12px", marginTop: "2px" }}>
                                          {project.description.length > 60
                                            ? project.description.slice(0, 60) + "..."
                                            : project.description}
                                        </div>
                                      </td>

                                      {/* CONTRACTOR DROPDOWN */}
                                      <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                                        <select
                                          value={project.contractor?._id || ""}
                                          onChange={(e) => handleUpdateContractor(project, e.target.value)}
                                          style={{
                                            padding: "5px 10px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            background: project.contractor ? "#f8fafc" : "#fff",
                                            color: project.contractor ? "#0f172a" : "#94a3b8",
                                            fontSize: "12.5px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            outline: "none",
                                            maxWidth: "180px",
                                            width: "100%",
                                            textOverflow: "ellipsis",
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                                            transition: "all 0.2s ease",
                                          }}
                                          title="Change assigned contractor"
                                        >
                                          <option value="" style={{ color: "#94a3b8" }}>— No contractor —</option>
                                          {contractorsList.map((c) => (
                                            <option key={c._id} value={c._id} style={{ color: "#0f172a", fontWeight: 500 }}>
                                              {c.nom}
                                            </option>
                                          ))}
                                        </select>
                                      </td>

                                      {/* STATUS DROPDOWN */}
                                      <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                                        <select
                                          value={project.status}
                                          onChange={(e) => handleUpdateStatus(project, e.target.value)}
                                          style={{
                                            ...styles.statusBadge,
                                            ...getStatusStyle(project.status),
                                            border: "none",
                                            cursor: "pointer",
                                            outline: "none",
                                            padding: "4px 10px",
                                            borderRadius: "14px",
                                            fontWeight: 700,
                                            fontSize: "11.5px",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                          }}
                                          title="Change status"
                                        >
                                          <option value="En attente" style={{ background: "#fff", color: "#d97706", fontWeight: 600 }}>
                                            Pending
                                          </option>
                                          <option value="En cours" style={{ background: "#fff", color: "#2563eb", fontWeight: 600 }}>
                                            In Progress
                                          </option>
                                          <option value="Complété" style={{ background: "#fff", color: "#059669", fontWeight: 600 }}>
                                            Completed
                                          </option>
                                        </select>
                                      </td>

                                      {/* COMMENTABLE */}
                                      <td style={{ ...styles.tdCenter, fontSize: "14px" }}>
                                        {hasComments ? (
                                          <span style={{ color: "#0f172a", fontWeight: 700 }}>
                                            ✓ <span style={{ fontSize: "11px", color: "#64748b" }}>({project.comments.length})</span>
                                          </span>
                                        ) : (
                                          <span style={{ color: "#94a3b8", fontSize: "13px" }}>✕</span>
                                        )}
                                      </td>

                                      {/* ACTION BUTTONS: PENCIL, EYE, TRASH */}
                                      <td style={{ ...styles.td, textAlign: "right" }}>
                                        <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                                          {/* PENCIL EDIT */}
                                          <button
                                            style={{
                                              background: "transparent",
                                              border: "none",
                                              color: "#0ea5e9",
                                              cursor: "pointer",
                                              fontSize: "15px",
                                              padding: "4px",
                                              display: "flex",
                                              alignItems: "center",
                                            }}
                                            onClick={() => handleEdit(project)}
                                            title="Edit"
                                          >
                                            <FaPencilAlt />
                                          </button>

                                          {/* EYE VIEW DETAILS */}
                                          <button
                                            style={{
                                              background: "transparent",
                                              border: "none",
                                              color: "#0ea5e9",
                                              cursor: "pointer",
                                              fontSize: "16px",
                                              padding: "4px",
                                              display: "flex",
                                              alignItems: "center",
                                            }}
                                            onClick={() => {
                                              setSelectedProjectId(project.id);
                                              setShowDetails(true);
                                            }}
                                            title="View details"
                                          >
                                            <FaEye />
                                          </button>

                                          {/* TRASH DELETE */}
                                          <button
                                            style={{
                                              background: "transparent",
                                              border: "none",
                                              color: "#ef4444",
                                              cursor: "pointer",
                                              fontSize: "14px",
                                              padding: "4px",
                                              display: "flex",
                                              alignItems: "center",
                                            }}
                                            onClick={() => handleDelete(project.id)}
                                            title="Delete"
                                          >
                                            <FaTrash />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>

                            {/* PAGINATION BAR */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "14px 18px",
                                background: "#f8fafc",
                                borderTop: "1px solid #e2e8f0",
                                flexWrap: "wrap",
                                gap: "10px",
                              }}
                            >
                              {/* LEFT INFO */}
                              <div style={{ fontSize: "13px", color: "#475569", fontWeight: 500 }}>
                                {totalCount === 0 ? "0 of 0" : `${startItem}-${endItem} of ${totalCount}`}
                              </div>

                              {/* RIGHT NAVIGATION */}
                              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                {safePage > 1 && (
                                  <button
                                    onClick={() => setGroupPage(grp.key, safePage - 1)}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "#0ea5e9",
                                      fontSize: "13px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    &lt; PREV
                                  </button>
                                )}

                                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                                  <button
                                    key={pageNum}
                                    onClick={() => setGroupPage(grp.key, pageNum)}
                                    style={{
                                      background: pageNum === safePage ? "#e0f2fe" : "transparent",
                                      border: "none",
                                      color: pageNum === safePage ? "#0369a1" : "#475569",
                                      fontSize: "13px",
                                      fontWeight: pageNum === safePage ? 800 : 500,
                                      cursor: "pointer",
                                      padding: "4px 8px",
                                      borderRadius: "4px",
                                      minWidth: "24px",
                                    }}
                                  >
                                    {pageNum}
                                  </button>
                                ))}

                                {safePage < totalPages && (
                                  <button
                                    onClick={() => setGroupPage(grp.key, safePage + 1)}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "#0ea5e9",
                                      fontSize: "13px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    NEXT &gt;
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SIDE DETAILS PANEL & MOBILE BACKDROP */}
        {showDetails && selectedProject && (
          <>
            <div className="admin-drawer-backdrop" onClick={() => setShowDetails(false)} />
            <div className="admin-side-panel">
              <div style={styles.sidePanelTopBar}>
                <button style={styles.kebabBtn}>•••</button>
                <button style={styles.closeBtn} onClick={() => setShowDetails(false)}>✕</button>
              </div>

            <h3 style={styles.panelTitle}>{selectedProject.name}</h3>
            <p style={styles.breadcrumb}>
              in → <span style={styles.breadcrumbLink}>Project Initiation & Discovery</span> Board
            </p>

            {/* INFOS */}
            <div style={styles.infoSection}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>
                  <span style={{ ...styles.iconSquare, background: "#fdab3d" }}>●</span>
                  Status
                </span>
                <select
                  value={selectedProject.status}
                  onChange={(e) => handleUpdateStatus(selectedProject, e.target.value)}
                  style={{
                    ...styles.statusBadge,
                    ...getStatusStyle(selectedProject.status),
                    border: "none",
                    cursor: "pointer",
                    outline: "none",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontWeight: 700,
                    fontSize: "12px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                  title="Change status"
                >
                  <option value="En attente" style={{ background: "#fff", color: "#d97706", fontWeight: 600 }}>
                    Pending
                  </option>
                  <option value="En cours" style={{ background: "#fff", color: "#2563eb", fontWeight: 600 }}>
                    In Progress
                  </option>
                  <option value="Complété" style={{ background: "#fff", color: "#059669", fontWeight: 600 }}>
                    Completed
                  </option>
                </select>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>
                  <span style={{ ...styles.iconSquare, background: "#ffcb00", color: "#7a5b00" }}>T</span>
                  Contractor
                </span>
                <select
                  value={selectedProject.contractor?._id || ""}
                  onChange={(e) => handleUpdateContractor(selectedProject, e.target.value)}
                  style={styles.infoInput}
                >
                  <option value="">No contractor</option>
                  {contractorsList.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>
                  <span style={{ ...styles.iconSquare, background: "#a25ddc" }}>📅</span>
                  Date
                </span>
                <span style={styles.infoValue}>{selectedProject.date}</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>
                  <span style={{ ...styles.iconSquare, background: "#00c875" }}>☰</span>
                  Notes
                </span>
                <span style={styles.infoValue}>{selectedProject.description}</span>
              </div>
            </div>

            {/* TABS */}
            <div style={styles.tabs}>
              <button
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === "comments" ? styles.tabActive : {}),
                }}
                onClick={() => setActiveTab("comments")}
              >
                <FaComment /> Comments ({selectedProject.comments.length})
              </button>
              <button
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === "links" ? styles.tabActive : {}),
                }}
                onClick={() => setActiveTab("links")}
              >
                <FaLink /> Links ({selectedProject.links.length})
              </button>
              <button
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === "files" ? styles.tabActive : {}),
                }}
                onClick={() => setActiveTab("files")}
              >
                <FaFile /> Files ({selectedProject.files.length})
              </button>
              <button
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === "images" ? styles.tabActive : {}),
                }}
                onClick={() => setActiveTab("images")}
              >
                <FaImage /> Images ({selectedProject.images.length})
              </button>
            </div>

            {/* COMMENTS */}
            {activeTab === "comments" && (
              <div style={styles.tabContent}>
                <div style={styles.inputSection}>
                  <textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={styles.commentInput}
                    rows={3}
                  />
                  <button
                    style={styles.addItemBtn}
                    onClick={() => handleAddComment(selectedProjectId!)}
                  >
                    Add Comment
                  </button>
                </div>

                <div style={styles.itemsList}>
                  {selectedProject.comments.length === 0 ? (
                    <p style={{ color: "#888", fontSize: "14px", fontStyle: "italic", padding: "10px 0" }}>
                      No comments yet.
                    </p>
                  ) : (
                    selectedProject.comments.map((comment) => (
                      <div
                        key={comment.id}
                        style={{
                          background: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          padding: "14px",
                          marginBottom: "12px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                      >
                        <div style={styles.commentHeader}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div
                              style={{
                                width: "26px",
                                height: "26px",
                                borderRadius: "50%",
                                background: "#fdab3d",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: 700,
                              }}
                            >
                              {comment.author.charAt(0).toUpperCase()}
                            </div>
                            <strong style={styles.commentAuthor}>{comment.author}</strong>
                          </div>
                          <span style={styles.commentDate}>{comment.date}</span>
                        </div>

                        <p style={{ ...styles.commentText, margin: "8px 0 10px 0", color: "#1e293b", fontSize: "13.5px", lineHeight: 1.5 }}>
                          {comment.text}
                        </p>

                        {/* COMMENT ACTIONS BAR */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                          <button
                            onClick={() => {
                              if (replyingToCommentId === comment.id) {
                                setReplyingToCommentId(null);
                                setReplyText("");
                              } else {
                                setReplyingToCommentId(comment.id);
                                setReplyText("");
                              }
                            }}
                            style={{
                              background: replyingToCommentId === comment.id ? "#ffedd5" : "#f8fafc",
                              color: "#ea580c",
                              border: "1px solid #fed7aa",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <FaReply /> {replyingToCommentId === comment.id ? "Close reply" : "Reply"}
                          </button>

                          <button
                            style={{
                              ...styles.deleteItemBtn,
                              padding: "4px 8px",
                              fontSize: "11.5px",
                            }}
                            onClick={() => handleDeleteComment(selectedProjectId!, comment.id)}
                            title="Delete this comment"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>

                        {/* INLINE REPLY INPUT */}
                        {replyingToCommentId === comment.id && (
                          <div
                            style={{
                              marginTop: "10px",
                              padding: "10px",
                              background: "#fff7ed",
                              borderRadius: "8px",
                              border: "1px solid #fed7aa",
                            }}
                          >
                            <input
                              type="text"
                              placeholder={`Reply to ${comment.author}...`}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleAddReply(selectedProjectId!, comment.id);
                                }
                              }}
                              autoFocus
                              style={{
                                width: "100%",
                                padding: "8px 10px",
                                border: "1px solid #fdba74",
                                borderRadius: "6px",
                                fontSize: "12.5px",
                                outline: "none",
                                background: "#fff",
                                boxSizing: "border-box",
                                marginBottom: "6px",
                              }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                              <button
                                onClick={() => {
                                  setReplyingToCommentId(null);
                                  setReplyText("");
                                }}
                                style={{
                                  background: "#e2e8f0",
                                  color: "#475569",
                                  border: "none",
                                  padding: "4px 10px",
                                  borderRadius: "4px",
                                  fontSize: "11.5px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleAddReply(selectedProjectId!, comment.id)}
                                style={{
                                  background: "#ea580c",
                                  color: "#fff",
                                  border: "none",
                                  padding: "4px 12px",
                                  borderRadius: "4px",
                                  fontSize: "11.5px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <FaPaperPlane style={{ fontSize: "10px" }} /> Send
                              </button>
                            </div>
                          </div>
                        )}

                        {/* NESTED REPLIES */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div
                            style={{
                              marginTop: "12px",
                              paddingLeft: "12px",
                              borderLeft: "2px solid #fdba74",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            {comment.replies.map((reply) => (
                              <div
                                key={reply.id}
                                style={{
                                  background: "#f8fafc",
                                  border: "1px solid #f1f5f9",
                                  borderRadius: "8px",
                                  padding: "8px 10px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ color: "#ea580c", fontSize: "11px", fontWeight: 700 }}>↳</span>
                                    <strong style={{ fontSize: "12px", color: "#0f172a" }}>
                                      {reply.author}
                                    </strong>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>{reply.date}</span>
                                    <button
                                      onClick={() =>
                                        handleDeleteReply(selectedProjectId!, comment.id, reply.id)
                                      }
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#ef4444",
                                        cursor: "pointer",
                                        fontSize: "11px",
                                        padding: "2px",
                                      }}
                                      title="Delete this reply"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </div>
                                <p style={{ margin: 0, fontSize: "12.5px", color: "#334155", lineHeight: 1.4 }}>
                                  {reply.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* LINKS */}
            {activeTab === "links" && (
              <div style={styles.tabContent}>
                <div style={styles.inputSection}>
                  <input
                    type="text"
                    placeholder="Link title"
                    value={newLink.title}
                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                    style={styles.input}
                  />
                  <input
                    type="url"
                    placeholder="URL"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    style={styles.input}
                  />
                  <button
                    style={styles.addItemBtn}
                    onClick={() => handleAddLink(selectedProjectId!)}
                  >
                    Add Link
                  </button>
                </div>

                <div style={styles.itemsList}>
                  {selectedProject.links.map((link) => (
                    <div key={link.id} style={styles.linkItem}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" style={styles.linkUrl}>
                        🔗 {link.title}
                      </a>
                      <button
                        style={styles.deleteItemBtn}
                        onClick={() => handleDeleteLink(selectedProjectId!, link.id)}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FILES */}
            {activeTab === "files" && (
              <div style={styles.tabContent}>
                <div style={styles.inputSection}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFileObj(e.target.files[0]);
                          if (!newFile.name) {
                            setNewFile({ ...newFile, name: e.target.files[0].name });
                          }
                        }
                      }}
                      style={{
                        ...styles.input,
                        padding: "8px",
                        cursor: "pointer",
                        background: "#fff",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Custom name (optional)"
                      value={newFile.name}
                      onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                      style={styles.input}
                    />
                    <button
                      style={{
                        ...styles.addItemBtn,
                        opacity: isUploading ? 0.7 : 1,
                        cursor: isUploading ? "not-allowed" : "pointer",
                      }}
                      onClick={() => handleAddFile(selectedProjectId!)}
                      disabled={isUploading}
                    >
                      <FaUpload style={{ marginRight: "6px" }} />
                      {isUploading ? "Uploading..." : "Upload File"}
                    </button>
                  </div>
                </div>

                {selectedProject.files.length > 0 && (
                  <div style={{ marginBottom: "12px", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      style={{
                        background: "#8b5cf6",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onClick={() => handleExportProjectFilesZip(selectedProject.id, selectedProject.name)}
                      title="Download all files and images of this project as ZIP archive"
                    >
                      <FaFileArchive /> Export project files (.ZIP)
                    </button>
                  </div>
                )}

                <div style={styles.itemsList}>
                  {selectedProject.files.length === 0 ? (
                    <p style={{ color: "#888", fontSize: "14px", fontStyle: "italic", padding: "10px 0" }}>
                      No files attached to this project.
                    </p>
                  ) : (
                    selectedProject.files.map((file) => (
                      <div
                        key={file.id}
                        style={{
                          ...styles.fileItem,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          background: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          marginBottom: "8px",
                          gap: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", flex: 1 }}>
                          <span style={{ fontSize: "18px" }}>📄</span>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#1e293b",
                              wordBreak: "break-all",
                            }}
                            title={file.name}
                          >
                            {file.name}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                          <button
                            onClick={() => handleDownloadFile(selectedProjectId!, file.id, file.name)}
                            style={{
                              padding: "6px 10px",
                              background: "#0284c7",
                              color: "#fff",
                              border: "none",
                              borderRadius: "5px",
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                            title="Download / Export this file"
                          >
                            <FaDownload /> Export
                          </button>
                          <button
                            style={styles.deleteItemBtn}
                            onClick={() => handleDeleteFile(selectedProjectId!, file.id)}
                            title="Delete"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* IMAGES */}
            {activeTab === "images" && (
              <div style={styles.tabContent}>
                <div style={styles.inputSection}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedImageObj(e.target.files[0]);
                          if (!newImage.title) {
                            setNewImage({ ...newImage, title: e.target.files[0].name });
                          }
                        }
                      }}
                      style={{
                        ...styles.input,
                        padding: "8px",
                        cursor: "pointer",
                        background: "#fff",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Image title (optional)"
                      value={newImage.title}
                      onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                      style={styles.input}
                    />
                    <button
                      style={{
                        ...styles.addItemBtn,
                        opacity: isUploadingImage ? 0.7 : 1,
                        cursor: isUploadingImage ? "not-allowed" : "pointer",
                      }}
                      onClick={() => handleAddImage(selectedProjectId!)}
                      disabled={isUploadingImage}
                    >
                      <FaUpload style={{ marginRight: "6px" }} />
                      {isUploadingImage ? "Uploading..." : "Upload Image"}
                    </button>
                  </div>
                </div>

                <div style={styles.imagesGrid}>
                  {selectedProject.images.length === 0 ? (
                    <p style={{ color: "#888", fontSize: "14px", fontStyle: "italic", padding: "10px 0" }}>
                      No images attached to this project.
                    </p>
                  ) : (
                    selectedProject.images.map((image) => (
                      <div key={image.id} style={styles.imageCard}>
                        <a href={image.url} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                          <img src={image.url} alt={image.title} style={styles.image} />
                        </a>
                        {image.title && <p style={styles.imageTitle}>{image.title}</p>}
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "8px" }}>
                          <button
                            onClick={() => handleDownloadImage(selectedProjectId!, image.id, image.title || "image.png")}
                            style={{
                              padding: "6px 10px",
                              background: "#0284c7",
                              color: "#fff",
                              border: "none",
                              borderRadius: "5px",
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                            title="Download / Export this image"
                          >
                            <FaDownload /> Export
                          </button>
                          <button
                            style={styles.deleteImageBtn}
                            onClick={() => handleDeleteImage(selectedProjectId!, image.id)}
                            title="Delete"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          </>
        )}
      </div>
        </>
      )}
    </div>
  );
}

function getStatusStyle(status: string): React.CSSProperties {
  switch (status) {
    case "En cours":
      return { background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff" };
    case "Complété":
      return { background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" };
    default:
      return { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff" };
  }
}

const styles: { [key: string]: React.CSSProperties } = {
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1.5px solid #f1f5f9",
  },

  formTitle: {
    fontSize: "clamp(20px, 3.5vw, 24px)",
    fontWeight: 800,
    color: "#1e3c72",
    margin: 0,
  },

  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#64748b",
    padding: "4px",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    width: "100%",
    padding: "12px 16px",
    marginBottom: "16px",
    border: "1.5px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "14.5px",
    boxSizing: "border-box",
    outline: "none",
    background: "#fff",
    color: "#0f172a",
    transition: "border-color 0.2s ease",
  },

  textarea: {
    width: "100%",
    padding: "12px 16px",
    marginBottom: "16px",
    border: "1.5px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "14.5px",
    fontFamily: "inherit",
    boxSizing: "border-box",
    outline: "none",
    resize: "vertical",
    background: "#fff",
    color: "#0f172a",
  },

  commentInput: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: "12px",
    border: "1.5px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "inherit",
    boxSizing: "border-box",
    outline: "none",
    resize: "vertical",
    background: "#fff",
  },

  saveBtn: {
    flex: 1,
    padding: "12px 20px",
    background: "linear-gradient(135deg, #ff6e00 0%, #ff8533 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "15px",
    boxShadow: "0 6px 16px rgba(255, 110, 0, 0.25)",
  },

  cancelBtn: {
    flex: 1,
    padding: "12px 20px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "15px",
  },

  tabs: {
    display: "flex",
    gap: "6px",
    marginBottom: "20px",
    borderBottom: "1.5px solid #e2e8f0",
    paddingBottom: "8px",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    flexWrap: "nowrap",
  },

  tabBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "13.5px",
    fontWeight: 600,
    color: "#64748b",
    borderBottom: "2.5px solid transparent",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  tabActive: {
    color: "#ff6e00",
    borderBottom: "2.5px solid #ff6e00",
    fontWeight: 700,
  },

  tabContent: {
    minHeight: "200px",
  },

  inputSection: {
    marginBottom: "20px",
    paddingBottom: "20px",
    borderBottom: "1.5px solid #f1f5f9",
  },

  addItemBtn: {
    width: "100%",
    padding: "10px 16px",
    background: "linear-gradient(135deg, #ff6e00 0%, #ff8533 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },

  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  commentItem: {
    background: "#f8fafc",
    padding: "14px 16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },

  commentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
    gap: "8px",
  },

  commentAuthor: {
    color: "#1e3c72",
    fontSize: "13.5px",
    fontWeight: 700,
  },

  commentDate: {
    color: "#94a3b8",
    fontSize: "11.5px",
  },

  commentText: {
    color: "#334155",
    fontSize: "13.5px",
    margin: "6px 0",
    lineHeight: 1.5,
  },

  linkItem: {
    background: "#f8fafc",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },

  linkUrl: {
    color: "#2563eb",
    textDecoration: "none",
    fontSize: "13.5px",
    fontWeight: 600,
    wordBreak: "break-all",
  },

  fileItem: {
    background: "#f8fafc",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },

  deleteItemBtn: {
    padding: "6px 12px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    fontWeight: 600,
    flexShrink: 0,
  },

  imagesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "12px",
  },

  imageCard: {
    background: "#f8fafc",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    padding: "6px",
  },

  image: {
    width: "100%",
    height: "120px",
    objectFit: "cover",
    borderRadius: "6px",
    display: "block",
  },

  imageTitle: {
    padding: "6px 4px",
    margin: 0,
    fontSize: "12px",
    fontWeight: 600,
    color: "#1e293b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  deleteImageBtn: {
    padding: "6px 10px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    fontSize: "12px",
  },

  tableWrapper: {
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: "14px",
  },

  th: {
    textAlign: "left",
    padding: "12px 16px",
    background: "#f8fafc",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "1.5px solid #e2e8f0",
    whiteSpace: "nowrap",
  },

  thWithIcon: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },

  infoIcon: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    border: "1px solid #cbd5e1",
    color: "#94a3b8",
    fontSize: "10px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textTransform: "none",
  },

  thCenter: {
    textAlign: "center",
    padding: "12px 14px",
    background: "#f8fafc",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 700,
    borderBottom: "1.5px solid #e2e8f0",
    whiteSpace: "nowrap",
  },

  tr: {
    cursor: "pointer",
    transition: "background 0.15s ease",
    borderBottom: "1px solid #f1f5f9",
  },

  trActive: {
    background: "rgba(59, 130, 246, 0.08)",
  },

  td: {
    padding: "12px 16px",
    color: "#334155",
    verticalAlign: "middle",
  },

  tdAccent: {
    boxShadow: "inset 3px 0 0 0 #3b82f6",
  },

  tdCenter: {
    padding: "12px 14px",
    color: "#64748b",
    textAlign: "center",
    verticalAlign: "middle",
  },

  tdProjectName: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#0f172a",
  },

  tdProjectDesc: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
    maxWidth: "280px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  statusBadge: {
    padding: "4px 10px",
    borderRadius: "14px",
    fontSize: "11.5px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  tableActions: {
    display: "flex",
    gap: "6px",
    justifyContent: "flex-end",
  },

  iconBtnEdit: {
    width: "30px",
    height: "30px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9",
    color: "#0284c7",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },

  iconBtnDelete: {
    width: "30px",
    height: "30px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fef2f2",
    color: "#ef4444",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },

  sidePanelTopBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },

  kebabBtn: {
    background: "none",
    border: "none",
    fontSize: "18px",
    letterSpacing: "-1px",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "2px 6px",
  },

  panelTitle: {
    fontSize: "clamp(20px, 3.5vw, 24px)",
    fontWeight: 800,
    color: "#0f172a",
    margin: 0,
    wordBreak: "break-word",
  },

  breadcrumb: {
    fontSize: "12px",
    color: "#64748b",
    margin: "6px 0 20px 0",
  },

  breadcrumbLink: {
    color: "#3b82f6",
    fontWeight: 600,
  },

  infoSection: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    marginBottom: "24px",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },

  infoRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    alignItems: "center",
  },

  infoLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#475569",
    background: "#fff",
  },

  iconSquare: {
    width: "20px",
    height: "20px",
    borderRadius: "5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },

  infoValue: {
    padding: "10px 12px",
    fontSize: "13px",
    color: "#0f172a",
    background: "#f8fafc",
    wordBreak: "break-word",
  },

  infoValuePillWrap: {
    padding: "8px 12px",
    background: "#f8fafc",
  },

  infoInput: {
    padding: "10px 12px",
    fontSize: "13px",
    color: "#0f172a",
    background: "#f8fafc",
    border: "none",
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },

  empty: {
    textAlign: "center",
    padding: "60px 20px",
  },

  emptyIcon: {
    fontSize: "48px",
    margin: "0 0 16px 0",
  },

  emptyText: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#1e3c72",
    margin: 0,
  },
};