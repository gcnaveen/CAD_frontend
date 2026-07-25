import React, { useCallback, useEffect, useState } from "react";
import { Avatar, Button, Spin, Typography } from "antd";
import { EditOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { setCredentials } from "../../../features/auth/authSlice";
import { getUserById } from "../../../services/user/userService";
import { useUserDisplayName } from "../../../hooks/useUserDisplayName";
import { cadBi } from "../cadBilingual";

const { Text } = Typography;

function resolveProfilePhotoUrl(user) {
  if (!user) return "";
  return user.personalDetails?.profilePhotoUrl || user.profilePhotoUrl || "";
}

function mapProfileFields(raw, authUser) {
  const data = raw?.data?.user || raw?.user || raw?.data || raw || {};
  const personal = data.personalDetails || {};

  const firstName = personal.firstName ?? data.firstName ?? authUser?.firstName ?? "";
  const lastName = personal.lastName ?? data.lastName ?? authUser?.lastName ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    fullName,
    email: personal.email ?? data.email ?? authUser?.email ?? "",
    phone: personal.phone ?? data.phone ?? authUser?.phone ?? "",
    profilePhotoUrl: resolveProfilePhotoUrl(data) || resolveProfilePhotoUrl(authUser),
  };
}

const CadProfileMenu = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authUser = useSelector((s) => s.auth?.user);
  const token = useSelector((s) => s.auth?.token);
  const userId = authUser?._id;

  const { userName, userInitial, displayName } = useUserDisplayName();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(() => mapProfileFields(null, authUser));

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await getUserById(userId);
      setProfile(mapProfileFields(response, authUser));
      const data = response?.data?.user || response?.user || response?.data || response || {};
      dispatch(setCredentials({ token, user: { ...(authUser || {}), ...data } }));
    } catch {
      setProfile(mapProfileFields(null, authUser));
    } finally {
      setLoading(false);
    }
  }, [authUser, dispatch, token, userId]);

  useEffect(() => {
    if (open && userId) loadProfile();
  }, [open, userId, loadProfile]);

  const shownName = profile.fullName || displayName || userName;
  const photoUrl = profile.profilePhotoUrl;

  return (
    <div className="cad-profile-wrap">
      <button
        type="button"
        className="cad-profile-btn"
        aria-label={cadBi.layout.profileMenu}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar
          size={34}
          src={photoUrl || undefined}
          style={{
            backgroundColor: photoUrl ? undefined : "var(--accent-color)",
            color: "#fff",
          }}
        >
          {!photoUrl ? userInitial : null}
        </Avatar>
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="cad-profile-backdrop"
            aria-label={cadBi.layout.closeProfile}
            onClick={() => setOpen(false)}
          />
          <div className="cad-profile-panel">
            <Text strong className="cad-profile-panel-name">
              {shownName}
            </Text>

            {loading ? (
              <div className="cad-profile-panel-loading">
                <Spin size="small" />
              </div>
            ) : (
              <div className="cad-profile-panel-meta">
                {profile.email ? (
                  <div className="cad-profile-row">
                    <MailOutlined />
                    <span>{profile.email}</span>
                  </div>
                ) : null}
                {profile.phone ? (
                  <div className="cad-profile-row">
                    <PhoneOutlined />
                    <span>{profile.phone}</span>
                  </div>
                ) : null}
              </div>
            )}

            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              className="cad-profile-edit"
              onClick={() => {
                setOpen(false);
                navigate("/profile");
              }}
            >
              {cadBi.layout.editProfile}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default CadProfileMenu;
