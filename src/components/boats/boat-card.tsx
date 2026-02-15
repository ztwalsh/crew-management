'use client'

import { useRouter } from 'next/navigation'
import { Ship, MapPin, Sailboat, Hash } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Boat, CrewRole } from '@/types'

interface BoatCardProps {
  boat: Boat
  role: CrewRole
}

const roleBadgeVariant: Record<CrewRole, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  crew: 'outline',
}

const roleLabel: Record<CrewRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  crew: 'Crew',
}

export function BoatCard({ boat, role }: BoatCardProps) {
  const router = useRouter()

  return (
    <Card
      className="group cursor-pointer border-border/50 bg-[#22252F] transition-all duration-200 hover:border-[#0EA5E9]/40 hover:shadow-[0_0_15px_rgba(14,165,233,0.08)]"
      onClick={() => router.push(`/boats/${boat.id}`)}
    >
      <CardContent className="pt-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#0EA5E9]/10 text-[#0EA5E9]">
              <Ship className="size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-foreground group-hover:text-[#0EA5E9] transition-colors">
                {boat.name}
              </h3>
              {boat.boat_type && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Sailboat className="size-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate">
                    {boat.boat_type}
                  </span>
                </div>
              )}
            </div>
          </div>
          <Badge variant={roleBadgeVariant[role]}>
            {roleLabel[role]}
          </Badge>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          {boat.sail_number && (
            <div className="flex items-center gap-1.5">
              <Hash className="size-3.5" />
              <span>{boat.sail_number}</span>
            </div>
          )}
          {boat.home_port && (
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              <span className="truncate">{boat.home_port}</span>
            </div>
          )}
        </div>

        {!boat.boat_type && !boat.sail_number && !boat.home_port && (
          <p className="mt-4 text-sm text-muted-foreground/60 italic">
            No details added yet
          </p>
        )}
      </CardContent>
    </Card>
  )
}
