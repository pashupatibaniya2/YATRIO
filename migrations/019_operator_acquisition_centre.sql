CREATE TABLE IF NOT EXISTS operator_acquisition_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  province text NOT NULL,
  district text NOT NULL,
  target_count integer NOT NULL DEFAULT 0 CHECK (target_count BETWEEN 0 AND 5000),
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operator_acquisition_targets_province_district_unique UNIQUE (province,district)
);

CREATE TABLE IF NOT EXISTS operator_acquisition_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  contact_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL DEFAULT '',
  province text NOT NULL,
  district text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','interested','application_started','converted','not_interested')),
  source text NOT NULL DEFAULT 'manual',
  campaign text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  next_follow_up_at date,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operator_acquisition_leads_district_fk FOREIGN KEY (province,district)
    REFERENCES operator_acquisition_targets(province,district) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_operator_acquisition_leads_region
  ON operator_acquisition_leads(province,district,status);
CREATE INDEX IF NOT EXISTS idx_operator_acquisition_leads_followup
  ON operator_acquisition_leads(next_follow_up_at,status);

INSERT INTO operator_acquisition_targets (province,district) VALUES
('Koshi','Taplejung'),('Koshi','Panchthar'),('Koshi','Ilam'),('Koshi','Jhapa'),('Koshi','Morang'),('Koshi','Sunsari'),('Koshi','Dhankuta'),('Koshi','Terhathum'),('Koshi','Sankhuwasabha'),('Koshi','Bhojpur'),('Koshi','Khotang'),('Koshi','Solukhumbu'),('Koshi','Okhaldhunga'),('Koshi','Udayapur'),
('Madhesh','Saptari'),('Madhesh','Siraha'),('Madhesh','Dhanusha'),('Madhesh','Mahottari'),('Madhesh','Sarlahi'),('Madhesh','Rautahat'),('Madhesh','Bara'),('Madhesh','Parsa'),
('Bagmati','Dolakha'),('Bagmati','Ramechhap'),('Bagmati','Sindhuli'),('Bagmati','Kavrepalanchok'),('Bagmati','Sindhupalchok'),('Bagmati','Rasuwa'),('Bagmati','Nuwakot'),('Bagmati','Dhading'),('Bagmati','Chitwan'),('Bagmati','Makwanpur'),('Bagmati','Bhaktapur'),('Bagmati','Lalitpur'),('Bagmati','Kathmandu'),
('Gandaki','Gorkha'),('Gandaki','Lamjung'),('Gandaki','Tanahun'),('Gandaki','Kaski'),('Gandaki','Manang'),('Gandaki','Mustang'),('Gandaki','Parbat'),('Gandaki','Syangja'),('Gandaki','Myagdi'),('Gandaki','Baglung'),('Gandaki','Nawalpur'),
('Lumbini','Nawalparasi West'),('Lumbini','Rupandehi'),('Lumbini','Kapilvastu'),('Lumbini','Palpa'),('Lumbini','Arghakhanchi'),('Lumbini','Gulmi'),('Lumbini','Rukum East'),('Lumbini','Rolpa'),('Lumbini','Pyuthan'),('Lumbini','Dang'),('Lumbini','Banke'),('Lumbini','Bardiya'),
('Karnali','Rukum West'),('Karnali','Salyan'),('Karnali','Dolpa'),('Karnali','Jumla'),('Karnali','Mugu'),('Karnali','Humla'),('Karnali','Kalikot'),('Karnali','Jajarkot'),('Karnali','Dailekh'),('Karnali','Surkhet'),
('Sudurpashchim','Bajura'),('Sudurpashchim','Bajhang'),('Sudurpashchim','Doti'),('Sudurpashchim','Achham'),('Sudurpashchim','Darchula'),('Sudurpashchim','Baitadi'),('Sudurpashchim','Dadeldhura'),('Sudurpashchim','Kanchanpur'),('Sudurpashchim','Kailali')
ON CONFLICT (province,district) DO NOTHING;