-- Auto-generate shareable codes for NEW videos
-- Run this ONCE in Supabase SQL Editor after the migration
-- After this, every new video gets a code automatically - you don't need to do anything

CREATE OR REPLACE FUNCTION auto_generate_shareable_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  attempt INT := 0;
  chars TEXT := '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
BEGIN
  IF NEW.shareable_code IS NULL THEN
    LOOP
      -- Generate 7-char code
      new_code := '';
      FOR i IN 1..7 LOOP
        new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      END LOOP;

      -- Check if unique
      SELECT EXISTS(SELECT 1 FROM "Videos" WHERE shareable_code = new_code) INTO code_exists;

      EXIT WHEN NOT code_exists OR attempt >= 10;
      attempt := attempt + 1;
    END LOOP;

    NEW.shareable_code := new_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_shareable_code
BEFORE INSERT ON "Videos"
FOR EACH ROW
EXECUTE FUNCTION auto_generate_shareable_code();
