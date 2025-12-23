import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useAuthStore } from '../store/useStore';
import { supabaseStorageService } from '../services/supabaseStorageService';
import { supabase } from '../config/supabase';
import genZToast from '../services/genZToast';
import { getCroppedImg } from '../utils/cropImage'; // Helper function we'll need to create
import { X, Upload, ZoomIn, Image as ImageIcon } from 'lucide-react';
import styles from './AvatarUploadModal.module.css';

interface AvatarUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess: (url: string) => void;
}

const AvatarUploadModal = ({ isOpen, onClose, onUploadSuccess }: AvatarUploadModalProps) => {
    const { user } = useAuthStore();
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [uploading, setUploading] = useState(false);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => setImageSrc(reader.result as string));
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels || !user) return;

        setUploading(true);
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (!croppedImageBlob) throw new Error('Could not create cropped image');

            const publicUrl = await supabaseStorageService.uploadAvatar(croppedImageBlob, user.id);

            // Update user metadata in Supabase Auth
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) throw updateError;

            onUploadSuccess(publicUrl);
            genZToast.success('New look! Avatar updated ✨');
            onClose();
        } catch (error) {
            console.error('Error saving avatar:', error);
            genZToast.error('Failed to update avatar 😢');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Update Avatar</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {!imageSrc ? (
                    <label className={styles.uploadTrigger}>
                        <input
                            type="file"
                            onChange={onFileChange}
                            accept="image/*"
                            hidden
                        />
                        <ImageIcon className={styles.uploadIcon} />
                        <span>Click to upload image</span>
                    </label>
                ) : (
                    <>
                        <div className={styles.cropContainer}>
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        <div className={styles.controls}>
                            <div className={styles.sliderContainer}>
                                <ZoomIn size={20} />
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className={styles.slider}
                                />
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <button className={styles.cancelBtn} onClick={() => setImageSrc(null)}>
                                Cancel
                            </button>
                            <button
                                className={styles.saveBtn}
                                onClick={handleSave}
                                disabled={uploading}
                            >
                                {uploading ? <div className={styles.loadingSpinner} /> : 'Save New Look'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AvatarUploadModal;
