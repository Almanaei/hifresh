-- Add CASCADE delete to bookings table
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_user_id_fkey,
ADD CONSTRAINT bookings_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE; 