-- Drop the old unique constraint on url
DROP INDEX IF EXISTS "Website_url_key";

-- Create the new composite unique constraint on user_id and url
CREATE UNIQUE INDEX "Website_user_id_url_key" ON "Website" ("user_id", "url");

