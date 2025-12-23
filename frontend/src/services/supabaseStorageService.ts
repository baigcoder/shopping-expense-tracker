import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

export const supabaseStorageService = {
    /**
     * Uploads an avatar image to the 'avatars' bucket.
     * @param file The file object (Blob or File) to upload.
     * @param userId The ID of the user the avatar belongs to.
     * @returns The public URL of the uploaded image.
     */
    async uploadAvatar(file: Blob | File, userId: string): Promise<string> {
        try {
            const fileExt = file.type.split('/')[1] || 'png';
            const fileName = `${userId}/${uuidv4()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false // Don't overwrite, create new unique files
                });

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            throw error;
        }
    },

    /**
     * Deletes an avatar image from the 'avatars' bucket.
     * @param path The path of the file to delete.
     */
    async deleteAvatar(path: string): Promise<void> {
        try {
            const { error } = await supabase.storage
                .from('avatars')
                .remove([path]);

            if (error) {
                throw error;
            }
        } catch (error) {
            console.error('Error deleting avatar:', error);
            throw error;
        }
    }
};
